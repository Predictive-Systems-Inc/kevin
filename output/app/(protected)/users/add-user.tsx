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
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().min(1, { message: 'Email is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
  created_at: z.date({
    required_error: 'Creation date is required.',
  }),
  updated_at: z.date({
    required_error: 'Updated date is required.',
  }),
})

interface AddUserProps {
  natures: Nature[]
  statuses: SystemCodes[]
  priorities: SystemCodes[]
  categories: Category[]
  divisions: Division[]
  users: User[]
}

export default function AddUser({
  natures,
  statuses,
  priorities,
  categories,
  divisions,
  users,
}: AddUserProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      created_at: '',
      updated_at: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    toast.promise(
      fetch('/api/user', {
        method: 'POST',
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      {
        loading: 'User is being added...',
        success: 'User added!',
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
          aria-label="Add user"
          variant="outline"
          size="sm"
          className="ml-auto h-8 lg:flex"
        >
          <AiOutlineFileAdd className="mr-2 size-4" aria-hidden="true" />
          Add User
        </Button>
      </SheetTrigger>
      <SheetContent
        className="overflow-y-scroll"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Add New User</SheetTitle>
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
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="created_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Created At</FormLabel>
                      <FormControl>
                        <DatePicker
                          id="created_at"
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
                  name="updated_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Updated At</FormLabel>
                      <FormControl>
                        <DatePicker
                          id="updated_at"
                          fieldValue={field.value}
                          fieldOnChange={field.onChange}
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