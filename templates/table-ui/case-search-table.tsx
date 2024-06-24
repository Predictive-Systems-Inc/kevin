'use client'

import { type ColumnDef } from '@tanstack/react-table'
import PriorityBadge from '@ui/core/priority-badge'
import { useDataTable } from '@ui/core/hooks/use-data-table'
import { Checkbox } from '@ui/core/shadcn/checkbox'
import { TableFloatingBar } from '@common/components/table-floating-bar'
import {
  DataTable,
  DataTableColumnHeader,
  DataTableTextField,
  DataTableAdvancedToolbar,
} from '@ui/core/data-table/index'
import { CaseWithRelations } from '@db/prisma/zod'
import { AddCase } from '@app/(protected)/practice-management/case-search/add-case'
import { Category, Division, Nature, SystemCodes, User } from '@db/prisma'
import { DataTableFilterField } from '@ui/core/types/index'
import { CaseSearchTableEmpty } from '@app/(protected)/practice-management/case-search/case-search-table-empty'
import { SomethingWentWrong } from '@common/components/something-went-wrong'
import { use, useMemo } from 'react'

interface CaseSearchTableProps {
  casesPromise: Promise<{ data: CaseWithRelations[]; pageCount: number }>
  tableData: Promise<{
    natures: Nature[]
    statuses: SystemCodes[]
    priorities: SystemCodes[]
    categories: Category[]
    divisions: Division[]
    users: User[]
    caseCount: number
  }>
}

export function CaseSearchTable({
  casesPromise,
  tableData,
}: CaseSearchTableProps) {
  // Learn more about React.use here: https://react.dev/reference/react/use
  const { data, pageCount } = use(casesPromise)
  const {
    natures,
    statuses,
    priorities,
    categories,
    divisions,
    users,
    caseCount,
  } = use(tableData)

  if (!data) {
    return <SomethingWentWrong />
  }

  if (caseCount === 0) {
    return (
      <CaseSearchTableEmpty
        natures={natures}
        statuses={statuses}
        priorities={priorities}
        categories={categories}
        divisions={divisions}
        users={users}
      />
    )
  }

  // Memoize the columns so they don't re-render on every render
  const columns = useMemo<ColumnDef<CaseWithRelations, unknown>[]>(
    () => [
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
        enableHiding: false,
      },
      {
        accessorKey: 'caseNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Case Number" />
        ),
        cell: ({ row }) => {
          const caseNumber = row.original.caseNumber
          return <DataTableTextField value={caseNumber} />
        },
      },
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Title" />
        ),
        cell: ({ row }) => {
          const title = row.original.title
          return <DataTableTextField value={title} />
        },
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Priority" />
        ),
        cell: ({ row }) => {
          const priority = row.original.priority?.name

          if (!priority) return null

          return <PriorityBadge priority={priority} />
        },
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
        },
      },
      {
        accessorKey: 'filingDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Filing Date" />
        ),
        cell: ({ row }) => {
          const filingDate = new Date(
            row.getValue('filingDate'),
          ).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
          })
          return <DataTableTextField value={filingDate} />
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          return <DataTableTextField value={row.original.status?.name ?? ''} />
        },
      },
      {
        accessorKey: 'category',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Category" />
        ),
        cell: ({ row }) => {
          const category = row.original.category?.name ?? ''
          return <DataTableTextField value={category} />
        },
      },
      {
        accessorKey: 'division',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Division" />
        ),
        cell: ({ row }) => {
          const division = row.original.division?.name ?? ''
          return <DataTableTextField value={division} />
        },
      },
      {
        accessorKey: 'nature',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nature" />
        ),
        cell: ({ row }) => {
          const nature = row.original.nature?.name ?? ''
          return <DataTableTextField value={nature} />
        },
      },
      {
        accessorKey: 'lastAction',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last Action" />
        ),
        cell: ({ row }) => {
          const lastActionTitle = row.original.lastAction?.action.title ?? ''
          return <DataTableTextField value={lastActionTitle} />
        },
        enableSorting: false,
      },
    ],
    [],
  )

  /**
   * This component can render either a faceted filter or a search filter based on the `options` prop.
   *
   * @prop options - An array of objects, each representing a filter option. If provided, a faceted filter is rendered. If not, a search filter is rendered.
   *
   * Each `option` object has the following properties:
   * @prop {string} label - The label for the filter option.
   * @prop {string} value - The value for the filter option.
   * @prop {React.ReactNode} [icon] - An optional icon to display next to the label.
   * @prop {boolean} [withCount] - An optional boolean to display the count of the filter option.
   */
  const filterFields: DataTableFilterField<CaseWithRelations>[] = [
    {
      label: 'Title',
      value: 'title',
      placeholder: 'Filter titles...',
    },
    {
      label: 'Case Number',
      value: 'caseNumber',
      placeholder: 'Filter case number...',
    },
    {
      label: 'Assigned To',
      value: 'assignedTo',
      placeholder: 'Filter assigned to...',
    },
    {
      label: 'Filing Date',
      value: 'filingDate',
      placeholder: 'Filter filing date...',
    },
    {
      label: 'Last Action',
      value: 'lastAction',
      placeholder: 'Filter last action...',
    },
    {
      label: 'Status',
      value: 'status',
      options: statuses.map((status) => ({
        label: status.name,
        value: status.name,
      })),
    },
    {
      label: 'Priority',
      value: 'priority',
      options: priorities.map((priority) => ({
        label: priority.name,
        value: priority.name,
      })),
    },
    {
      label: 'Category',
      value: 'category',
      options: categories.map((category) => ({
        label: category.name,
        value: category.name,
      })),
    },
    {
      label: 'Division',
      value: 'division',
      options: divisions.map((division) => ({
        label: division.name,
        value: division.name,
      })),
    },
    {
      label: 'Nature',
      value: 'nature',
      options: natures.map((nature) => ({
        label: nature.name,
        value: nature.name,
      })),
    },
  ]

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: true,
    defaultPerPage: 10,
    defaultSort: 'createdAt.desc',
    hiddenColumns: ['assignedTo', 'division', 'nature'],
  })

  return (
    <DataTable
      table={table}
      floatingBar={<TableFloatingBar table={table} />}
      rowUrl="/practice-management/case-profile/[id]/activities"
    >
      <DataTableAdvancedToolbar table={table} filterFields={filterFields}>
        <AddCase
          natures={natures}
          statuses={statuses}
          priorities={priorities}
          categories={categories}
          divisions={divisions}
          users={users}
        />
      </DataTableAdvancedToolbar>
    </DataTable>
  )
}
