import os
from langchain.prompts import ChatPromptTemplate
from langchain_openai.chat_models import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

def generate_code(requirements):
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

    openai_chat_model = ChatOpenAI(model="gpt-3.5-turbo")
    chain = prompt | openai_chat_model | StrOutputParser()
    print(f"Invoking model with {len(templates)} templates...")
    result = chain.invoke({"boilerplate": {boilerplate}, 
                           "count": len(templates),
                           "model": requirements["model"],
                           "fields_newline": "\n".join(requirements["fields"])})
    print("Saving to file...")
    # save boilerplate to file
    with open("debug/boilerplate.txt", "w") as f:
        f.write(boilerplate)
    files = result.split("Filename: ")
    for file in files:
        if not file:
            continue
        filename, code = file.split("Code:")
        dir = requirements["folder_location"]
        # append  dir to filename
        filename = os.path.join(dir, filename.strip())
        output_file = filename.strip().replace("templates/","")
        if "-page.tsx" in output_file:
            # remove name before -page.tsx
            # get the filename only
            dir_only = os.path.dirname(output_file)
            output_file = os.path.join(dir_only, "page.tsx")
        # add directory if not exists        
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, "w") as f:
            f.write(code)
            print(f"File {filename} has been generated.")
    print("Code generation complete.")


# create a main
def main():
    requirements = {
        "model": "User",
        "fields": ["id", "name", "email", "password", "created_at", "updated_at"]
    }
    generate_code(requirements)


# Using the special variable  
# __name__ 
if __name__=="__main__": 
    main() 