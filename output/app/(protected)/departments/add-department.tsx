
'use client'

import { Card, CardContent } from '@ui/core/shadcn/card'
import { Category, Division, Nature, SystemCodes, User } from '@db/prisma'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@ui/core/shadcn/form'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@ui/core/shadcn/sheet'

import { AiOutlineFileAdd } from 'react-icons/ai'
import { Button } from '@ui/core/shadcn/button'
import { Combobox } from '@ui/core/shadcn/combobox'
import { DatePicker } from '@ui/core/shadcn/datepicker'
import { Input } from '@ui/core/shadcn/input'
import React from 'react'
import { getErrorMessage } from '@common/lib/handle-error'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  name: z.string().min(1, { message: 'Department name is required' }),
  type: z.string().min(1, { message: 'Department type is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  isRequired: z.boolean().default(false),
})

interface AddDepartmentProps {
  categories: Category[]
}

export default function AddDepartment({
  categories,
}: AddDepartmentProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      category: '',
      description: '',
      isRequired: false,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    toast.promise(
      fetch('/api/department', {
        method: 'POST',
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      {
        loading: 'Department is being added...',
        success: 'Department added!',
        error: (err) => getErrorMessage(err),
      },
    )
    router.refresh()
    setSheetOpen(false)
    form.reset()
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label="Add department"
          variant="outline"
          size="sm"
          className="ml-auto h-8 lg:flex"
        >
          <AiOutlineFileAdd className="mr-2 size-4" aria-hidden="true" />
          Add Department
        </Button>
      </SheetTrigger>
      <SheetContent
        className="overflow-y-scroll"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Add New Department</SheetTitle>
        </SheetHeader>
        <Card className="mt-2">
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter department name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter department type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Combobox
                          id="CategoryId"
                          data={categories.map((category) => ({
                            value: category.id,
                            label: category.name,
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Is Required</FormLabel>
                      <FormControl>
                        <Combobox
                          id="IsRequiredId"
                          data={[
                            { value: true, label: 'Yes' },
                            { value: false, label: 'No' }
                          ]}
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button variant={'outline'} type="submit">
                  Save
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  )
}