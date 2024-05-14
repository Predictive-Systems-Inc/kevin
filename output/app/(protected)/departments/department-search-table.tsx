
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
import { DepartmentWithRelations } from '@db/prisma/zod'
import { MdPageview } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import AddDepartment from './add-department'
import { Department, Category } from '@db/prisma'

interface DepartmentSearchTableProps {
  departmentsPromise: Promise<{ data: DepartmentWithRelations[]; pageCount: number }>
  categories: Category[]
}

export function DepartmentSearchTable({ departmentsPromise, categories }: DepartmentSearchTableProps) {
  const router = useRouter()
  const { data, pageCount } = React.use(departmentsPromise)

  // Memoize the columns so they don't re-render on every render
  const columns = React.useMemo<ColumnDef<DepartmentWithRelations, unknown>[]>(
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
          const category: string = row.original.category?.name ?? ''
          return (
            <DataTableComponentField
              value={name}
              component={category && <PriorityBadge priority={category} />}
            />
          )
        }
      },
      {
        accessorKey: 'type',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const type = row.original.type
          return <DataTableTextField value={type} />
        }
      },
      {
        accessorKey: 'description',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const description = row.original.description
          return <DataTableTextField value={description} />
        }
      },
      {
        accessorKey: 'isRequired',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Is Required" />
        ),
        cell: ({ row }) => {
          return <DataTableTextField value={row.original.isRequired?.toString() ?? ''} />
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
                    router.push(`/department-profile/${row.original.id}/activities`)
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

  const searchableColumns: DataTableSearchableColumn<DepartmentWithRelations>[] = [
    {
      id: 'name',
      title: 'Department Name',
      placeholder: 'Filter names...'
    },
    {
      id: 'type',
      title: 'Department Type',
      placeholder: 'Filter types...'
    }
  ]

  const filterableColumns: DataTableFilterableColumn<DepartmentWithRelations>[] = []

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    searchableColumns,
    filterableColumns,
    hiddenColumns: ['category', 'description', 'isRequired']
  })

  return (
    <DataTable
      table={table}
      columns={columns}
      searchableColumns={searchableColumns}
      filterableColumns={filterableColumns}
      advancedFilter={true}
      floatingBarContent={<TableFloatingBarContent table={table} />}
      customButtons={[<AddDepartment categories={categories} />]}
      rowUrl="/department-profile/[id]/activities"
    />
  )
}

