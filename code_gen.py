import os
import re
import chainlit as cl
from langchain.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.schema.runnable.config import RunnableConfig

import subprocess

def save_to_file(result, location):
    print("Saving to file...")
    files = result.split("Filename: ")
    for file in files:
        if not file:
            continue
        filename, code = file.split("Code:")
        print("Saving to file: ", filename)
        dir = location
        # append  dir to filename
        filename = os.path.join(dir, filename.strip())
        output_file = filename.strip().replace("templates/","")
        if "-page.tsx" in output_file:
            # remove name before -page.tsx
            # get the filename only
            dir_only = os.path.dirname(output_file)
            output_file = os.path.join(dir_only, "page.tsx")
        # add directory if not exists        
        dir_name = os.path.dirname(output_file)
        # sanity check of code
        code = code.replace("```tsx", "").replace("```typescript", "").replace("```", "")
        if not os.path.isfile(dir_name):
            os.makedirs(dir_name, exist_ok=True)
        with open(output_file, "w") as f:
            f.write(code)
            print(f"File {filename} has been generated.")
    return files

@cl.step
def generate_code(requirements):
    current_step = cl.context.current_step
    current_step.input = "Generating code..."
    print("Generating code...")
    templates = {}
    for root, dirs, files in os.walk("templates/app/(protected)/cases"):
        for file in files:
            with open(os.path.join(root, file), "r") as f:
                templates[os.path.join(root, file)] = f.read()

    # create the prompt with all the templates
    boilerplate = ""
    for index, template in enumerate(templates):
        boilerplate += f"Start of Boilerplate #{index+1}: {template}\n"
        boilerplate += f"{templates[template]}\n"
        boilerplate += f"End of Boilerplate #{index+1}: {template}\n\n"

        
    template = """Generate {count} source code using next.js and prisma 
    based on the given {count} boilerplate below. 
    Follow the boilerplate markers to generate the multiple code. 

    -----------------
    {boilerplate}
    -----------------

    Replace the table name case to {model}.

    Replace the fields of the boilerplate with to include the new fields below:
      {fields_newline} 


    Respond immediately in the following format:
    Filename: [filename]
    Code: [code] 
    """
    prompt = ChatPromptTemplate.from_template(template)

    openai_chat_model = ChatOpenAI(model="gpt-4o", temperature=0)
    cb = cl.AsyncLangchainCallbackHandler(stream_final_answer=True)
    config = RunnableConfig(callbacks=[cb])
    chain = prompt | openai_chat_model | StrOutputParser()
    print(f"Invoking model with {len(templates)} templates...")
    result = chain.invoke({"boilerplate": {boilerplate}, 
                           "count": len(templates),
                           "model": requirements["model"],
                           "fields_newline": "\n".join(requirements["fields"])},
                           config=config)
    # save boilerplate to file
    with open("debug/boilerplate.txt", "w") as f:
        f.write(boilerplate)

    files = save_to_file(result, requirements["folder_location"])

    print("Code generation complete.")
    current_step.output = "Code generation complete."
    return files

def generate_one_code(requirements, filename):
    print("Generating code...")
    with open(filename, "r") as f:
        template = f.read()

    # create the prompt with all the templates
    boilerplate = ""
    boilerplate += f"Start of Boilerplate: {filename}\n"
    boilerplate += f"{template}\n"
    boilerplate += f"End of Boilerplate: {filename}\n\n"

        
    template = """Generate source code using next.js and prisma 
    based on the given boilerplate below. 
    Follow the boilerplate markers to generate the multiple code. 

    -----------------
    {boilerplate}
    -----------------

    Replace the table name case to {model}.

    Replace the fields of the boilerplate with to include the new fields below:
      {fields_newline} 


    Respond immediately in the following format:
    Filename: [filename]
    Code: [code] 
    """
    prompt = ChatPromptTemplate.from_template(template)

    openai_chat_model = ChatOpenAI(model="gpt-4o", temperature=0)
    cb = cl.AsyncLangchainCallbackHandler(stream_final_answer=True)
    config = RunnableConfig(callbacks=[cb])
    chain = prompt | openai_chat_model | StrOutputParser()
    print(f"Invoking model with {filename}...")
    result = chain.invoke({"boilerplate": {boilerplate}, 
                           "model": requirements["model"],
                           "fields_newline": "\n".join(requirements["fields"])},
                           config=config)
    # save boilerplate to file
    with open("debug/boilerplate.txt", "w") as f:
        f.write(boilerplate)

    files = save_to_file(result, requirements["folder_location"])

    print("Code generation complete.")
    return files


def find_warnings():
    file = "debug/lint.txt"
    filename = ""
    with open(file, "r") as f:
        lints = f.read()
    # split into "web:lint"
    lints = lints.split("\n")
    warnings = {}
    # check if there are any warnings for the files generated
    for lint in lints:        
        # if this refers to new file, get the filename
        lint = lint.strip()
        lint = re.sub(r'\x1b\[.*?m', '', lint)        
        print(lint)
        if lint.startswith("./"):
            print('START')
            filename = lint
        # if blank, disregard
        elif not lint.strip():
            print('END')
            filename = ""
            continue
        elif filename:
            print('.')
            # add the rows to the warnings
            # if dict does not exist, add it else, append to array of warnings
            if filename not in warnings:
                warnings[filename] = [lint]
            else:
                warnings[filename] += [lint]
    
    return warnings


def qa_generate_code(files):
    # execute pnpm lint as a command line on the project folder and save result to file
    # base_folder = path.dirname(files[0])
    base_path = "/Users/mlmnl/Documents/psi/brad/apps/web/"
    lint_file = "debug/lint.txt"

    with open(lint_file, "w") as f:
        # run the command and redirect output to file
        subprocess.run(["pnpm", "lint"], cwd=base_path, stdout=f)
        print("Linting complete.")
    # check the results of linting for the given files
    warnings = find_warnings()
    for file in files:
        # if there is a warning for this file
        file_rel = file.replace(base_path, "./")
        print(f"Checking lint of {file_rel}...")
        if file_rel in warnings:
            print(f"Fixing warnings for {file_rel}...")
            # read the contents of the file
            with open(file, "r") as f:
                code = f.read()

            template = """Fix the warnings that are present in the given source code below.

            -----------------
            {code}
            -----------------

            {warnings}

            Respond immediately in the following format:
            Filename: [filename]
            Code: [code] 
            """
            prompt = ChatPromptTemplate.from_template(template)     
            openai_chat_model = ChatOpenAI(model="gpt-4o")        
            chain = prompt | openai_chat_model | StrOutputParser()
            result = chain.invoke({"code": {code}, 
                                  "warnings": warnings[file_rel]})
            
            subfiles = result.split("Filename: ")
            for subfile in subfiles:
                if not subfile:
                    continue
                filename, code = subfile.split("Code:")
                print("Updating file: ", file)
                with open(file, "w") as f:
                    f.write(code)
                    print(f"File {file} has been updated.")

# create a main
def main():
  qa_generate_code(['/Users/mlmnl/Documents/psi/brad/apps/web/src/app/(protected)/departments/add-department.tsx'])
    # requirements = {
    #     "model": "User",
    #     "fields": ["id", "name", "email", "password", "created_at", "updated_at"],
    #     "folder_location": "output/"
    # }
    # generate_code(requirements)


# Using the special variable  
# __name__ 
if __name__=="__main__": 
    main() 