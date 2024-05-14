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
import { CaseWithRelations } from '@db/prisma/zod'
import { MdPageview } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import AddCase from './add-case'
import { Case, Category } from '@db/prisma'

interface CaseSearchTableProps {
  casesPromise: Promise<{ data: CaseWithRelations[]; pageCount: number }>
  categories: Category[]
}

export function CaseSearchTable({ casesPromise, categories }: CaseSearchTableProps) {
  const router = useRouter()
  const { data, pageCount } = React.use(casesPromise)

  // Memoize the columns so they don't re-render on every render
  const columns = React.useMemo<ColumnDef<CaseWithRelations, unknown>[]>(
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
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Title" />
        ),
        cell: ({ row }) => {
          const title = row.original.title
          const priority: string = row.original.priority?.name ?? ''
          return (
            <DataTableComponentField
              value={title}
              component={priority && <PriorityBadge priority={priority} />}
            />
          )
        }
      },
      {
        accessorKey: 'caseNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Case Number" />
        ),
        cell: ({ row }) => {
          const caseNumber = row.original.caseNumber
          return <DataTableTextField value={caseNumber} />
        }
      },
      {
        accessorKey: 'assignedTo',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Assigned To" />
        ),
        cell: ({ row }) => {
          const firstName = row.original.assignedTo?.firstname ?? ''
          const lastName = row.original.assignedTo?.lastname ?? ''
          return <DataTableTextField value={`${firstName} ${lastName}`} />
        }
      },
      {
        accessorKey: 'filingDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Filing Date" />
        ),
        cell: ({ row }) => {
          const filingDate = new Date(
            row.getValue('filingDate')
          ).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
          })
          return <DataTableTextField value={filingDate} />
        }
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          return <DataTableTextField value={row.original.status?.name ?? ''} />
        }
      },
      {
        accessorKey: 'category',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Category" />
        ),
        cell: ({ row }) => {
          const category = row.original.category?.name ?? ''
          return <DataTableTextField value={category} />
        }
      },
      {
        accessorKey: 'division',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Division" />
        ),
        cell: ({ row }) => {
          const division = row.original.division?.name ?? ''
          return <DataTableTextField value={division} />
        }
      },
      {
        accessorKey: 'nature',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nature" />
        ),
        cell: ({ row }) => {
          const nature = row.original.nature?.name ?? ''
          return <DataTableTextField value={nature} />
        }
      },
      {
        accessorKey: 'lastAction',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last Action" />
        ),
        cell: ({ row }) => {
          const lastActionTitle = row.original.lastAction?.action.title ?? ''
          return <DataTableTextField value={lastActionTitle} />
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
                    router.push(`/case-profile/${row.original.id}/activities`)
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

  const searchableColumns: DataTableSearchableColumn<CaseWithRelations>[] = [
    {
      id: 'title',
      title: 'Case Title',
      placeholder: 'Filter titles...'
    },
    {
      id: 'caseNumber',
      title: 'Case Number',
      placeholder: 'Filter case number...'
    }
  ]

  const filterableColumns: DataTableFilterableColumn<CaseWithRelations>[] = []

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    searchableColumns,
    filterableColumns,
    hiddenColumns: ['assignedTo', 'division', 'nature']
  })

  return (
    <DataTable
      table={table}
      columns={columns}
      searchableColumns={searchableColumns}
      filterableColumns={filterableColumns}
      advancedFilter={true}
      floatingBarContent={<TableFloatingBarContent table={table} />}
      customButtons={[<AddCase categories={categories} />]}
      rowUrl="/case-profile/[id]/activities"
    />
  )
}
