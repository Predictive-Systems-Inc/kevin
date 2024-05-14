 //start of the code below, include use client
'use client'

import React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import type {
  DataTableFilterableColumn,
  DataTableSearchableColumn
} from '@ui/core/types/index'
import { useDataTable } from '@ui/core/hooks/use-data-table'
import { Checkbox } from '@ui/core/shadcn/checkbox'
import { DataTable } from '@ui/core/data-table/data-table'
import { DataTableColumnHeader } from '@ui/core/data-table/data-table-column-header'
import { TableFloatingBarContent } from '@common/components/table-floating-bar-content'
import DataTableTextField from '@ui/core/data-table/data-table-text-field'
import TableActions from '@common/components/table-actions'
import DataTableComponentField from '@ui/core/data-table/data-table-component-field'
import PriorityBadge from '@ui/core/priority-badge'
import { UserWithRelations } from '@db/prisma/zod'
import { MdPageview } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import AddUser from './add-user'
import { User, Category } from '@db/prisma'

interface UserSearchTableProps {
  usersPromise: Promise<{ data: UserWithRelations[]; pageCount: number }>
  categories: Category[]
}

export function UserSearchTable({ usersPromise, categories }: UserSearchTableProps) {
  const router = useRouter()
  const { data, pageCount } = React.use(usersPromise)

  // Memoize the columns so they don't re-render on every render
  const columns = React.useMemo<ColumnDef<UserWithRelations, unknown>[]>(
    () => [
      // update the columns to match the new list of fields
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const name = row.original.name
          const priority: string = row.original.priority?.name ?? ''
          return (
            <DataTableComponentField
              value={name}
              component={priority && <PriorityBadge priority={priority} />}
            />
          )
        }
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => {
          const email = row.original.email
          return <DataTableTextField value={email} />
        }
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ row }) => {
          const createdAt = new Date(
            row.getValue('created_at')
          ).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
          })
          return <DataTableTextField value={createdAt} />
        }
      },
      {
        accessorKey: 'updated_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated At" />
        ),
        cell: ({ row }) => {
          const updatedAt = new Date(
            row.getValue('updated_at')
          ).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
          })
          return <DataTableTextField value={updatedAt} />
        }
      },
      {
        id: 'actions',
        cell: function Cell({ row }) {
          const [isDeletePending, startDeleteTransition] = React.useTransition()
          const [isUpdatePending, startUpdateTransition] = React.useTransition()

          return (
            <TableActions
              actions={[
                {
                  label: 'View',
                  onClick: () => {
                    router.push(`/user-profile/${row.original.id}/activities`)
                  },
                  icon: <MdPageview />
                }
              ]}
            />
          )
        }
      }
    ],
    []
  )

  const searchableColumns: DataTableSearchableColumn<UserWithRelations>[] = [
    {
      id: 'name',
      title: 'User Name',
      placeholder: 'Filter names...'
    },
    {
      id: 'email',
      title: 'Email',
      placeholder: 'Filter email...'
    }
  ]

  const filterableColumns: DataTableFilterableColumn<UserWithRelations>[] = []

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    searchableColumns,
    filterableColumns,
    hiddenColumns: ['email', 'created_at', 'updated_at']
  })

  return (
    <DataTable
      table={table}
      columns={columns}
      searchableColumns={searchableColumns}
      filterableColumns={filterableColumns}
      advancedFilter={true}
      floatingBarContent={<TableFloatingBarContent table={table} />}
      customButtons={[<AddUser categories={categories} />]}
      rowUrl="/user-profile/[id]/activities"
    />
  )
}

