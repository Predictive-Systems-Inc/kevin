import { Card, CardContent } from '@ui/core/shadcn/card'
import {
  FormComboboxField,
  FormDatepickerField,
  FormTextField,
} from '@ui/core/forms/index'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@ui/core/shadcn/sheet'

import { AiOutlineFileAdd } from 'react-icons/ai'
import { Button } from '@ui/core/shadcn/button'
import { Form } from '@ui/core/shadcn/form'
import React from 'react'
import { getErrorMessage } from '@common/lib/handle-error'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  date: z.date({
    required_error: 'Date is required.',
  }),
  user: z.string().min(1, { message: 'User is required' }),
  action: z.string().min(1, { message: 'Action is required' }),
  duration: z.string().min(1, { message: 'Duration is required' }),
  remarks: z.string().optional(),
})

export function AddHours() {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      user: '',
      action: '',
      duration: '',
      remarks: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await toast.promise(
      new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          resolve()
        }, 3000)
      }),
      {
        loading: 'Hours data is being added ...',
        success: () => {
          router.refresh()
          setSheetOpen(false)
          form.reset()
          return 'Hours data added!'
        },
        error: (err) => getErrorMessage(err),
      },
    )
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label="Add hours"
          variant="outline"
          size="sm"
          className="h-8 lg:flex"
        >
          <AiOutlineFileAdd className="mr-2 size-4" aria-hidden="true" />
          Add Hours
        </Button>
      </SheetTrigger>
      <SheetContent
        className="overflow-y-scroll"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Add Hours</SheetTitle>
        </SheetHeader>
        <Card className="mt-2">
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormDatepickerField
                  form={form}
                  label="Date"
                  formKey="date"
                  setCurrentDateAsDefaultValue
                />
                <FormComboboxField
                  form={form}
                  data={[
                    { value: '1', label: 'User 1' },
                    { value: '2', label: 'User 2' },
                    { value: '3', label: 'User 3' },
                  ]}
                  label="Who"
                  formKey="user"
                />
                <FormTextField
                  form={form}
                  formKey="action"
                  label="Action"
                  placeholder="Enter action"
                />
                <FormTextField
                  form={form}
                  formKey="duration"
                  label="Duration"
                  placeholder="Enter duration"
                />
                <FormTextField
                  form={form}
                  formKey="remarks"
                  label="Remarks"
                  placeholder="Enter remarks"
                />
                <Button
                  disabled={form.formState.isSubmitting}
                  variant={'outline'}
                  type="submit"
                >
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
