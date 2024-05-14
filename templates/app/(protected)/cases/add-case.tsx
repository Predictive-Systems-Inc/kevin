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
  title: z.string().min(1, { message: 'Case title is required' }),
  caseNumber: z.string().min(1, { message: 'Case number is required' }),
  filingDate: z.date({
    required_error: 'Filing date is required.',
  }),
  natureId: z.string().min(1, { message: 'Nature is required' }),
  statusKey: z.string().min(1, { message: 'Status is required' }),
  priorityKey: z.string().min(1, { message: 'Priority is required' }),
  categoryId: z.string().min(1, { message: 'Category is required' }),
  divisionId: z.string().min(1, { message: 'Division is required' }),
  assignedToId: z.string().min(1, { message: 'User is required' }),
})

interface AddCaseProps {
  natures: Nature[]
  statuses: SystemCodes[]
  priorities: SystemCodes[]
  categories: Category[]
  divisions: Division[]
  users: User[]
}

export default function AddCase({
  natures,
  statuses,
  priorities,
  categories,
  divisions,
  users,
}: AddCaseProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      caseNumber: '',
      natureId: '',
      statusKey: '',
      priorityKey: '',
      categoryId: '',
      divisionId: '',
      assignedToId: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    toast.promise(
      fetch('/api/case', {
        method: 'POST',
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      {
        loading: 'Case is being added...',
        success: 'Case added!',
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
          aria-label="Add case"
          variant="outline"
          size="sm"
          className="ml-auto h-8 lg:flex"
        >
          <AiOutlineFileAdd className="mr-2 size-4" aria-hidden="true" />
          Add Case
        </Button>
      </SheetTrigger>
      <SheetContent
        className="overflow-y-scroll"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Add New Case</SheetTitle>
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
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter case title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="caseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter case number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Combobox
                          id="UserId"
                          data={users.map((user) => ({
                            value: user.id,
                            label: `${user.firstname} ${user.lastname}`,
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
                  name="priorityKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Combobox
                          id="priorityId"
                          data={priorities.map((priority) => ({
                            value: priority.key,
                            label: priority.name,
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
                  name="filingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filing Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          id=":rd:-form-item"
                          fieldValue={field.value}
                          fieldOnChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="statusKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Status</FormLabel>
                      <FormControl>
                        <Combobox
                          id="statusId"
                          data={statuses.map((status) => ({
                            value: status.key,
                            label: status.name,
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
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Combobox
                          id="categoryId"
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
                  name="divisionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division</FormLabel>
                      <FormControl>
                        <Combobox
                          id="divisionId"
                          data={divisions.map((division) => ({
                            value: division.id,
                            label: division.name,
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
                  name="natureId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nature of Case</FormLabel>
                      <FormControl>
                        <Combobox
                          id="natureId"
                          data={natures.map((nature) => ({
                            value: nature.id,
                            label: nature.name,
                          }))}
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
