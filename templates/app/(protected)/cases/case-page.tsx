
import { SearchParams } from '@ui/core/types/index'
import { DataTableSkeleton } from '@ui/core/data-table/data-table-skeleton'
import { CaseSearchTable } from './case-search-table'
import { CaseWithRelations } from '@db/prisma/zod'
import { Category} from '@db/prisma'

import React from 'react'

interface IndexPageProps {
  searchParams: SearchParams
}

export default async function CaseSearchPage({ searchParams }: IndexPageProps) {
  const url = new URL('http://localhost:3000/api/case')
  Object.keys(searchParams).forEach((key) => {
    const value = searchParams[key]
    if (typeof value === 'string') {
      url.searchParams.append(key, value)
    }
  })

  const casesPromise: Promise<{
    data: CaseWithRelations[]
    pageCount: number
  }> = fetch(url.toString(), { method: 'GET', cache: 'no-store' }).then((res) =>
    res.json()
  )

  const categories: Category[] = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/category`,
    {
      method: 'GET',
    },
  ).then(async (res) => {
    const response = await res.json()
    return response.data
  })


  return (
    <div className="m-10">
      <h1 className="text-2xl font-bold mb-3">Cases</h1>

      <React.Suspense
        fallback={
          <DataTableSkeleton columnCount={6} filterableColumnCount={2} />
        }
      >
        <CaseSearchTable
          casesPromise={casesPromise}
          categories={categories}
        />
      </React.Suspense>
    </div>    
  )
}
