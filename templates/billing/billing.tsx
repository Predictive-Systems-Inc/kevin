import BillingData from '@app/(protected)/case-profile/[id]/billing/billing-data'
import React from 'react'
import Tabs from '@common/components/tabs'
import { TbClockDollar } from 'react-icons/tb'
import { TbFileDollar } from 'react-icons/tb'

interface BillingProps {
  id: string
  children: React.ReactNode
}

export default function Billing({ id, children }: BillingProps) {
  const billingTabs = [
    {
      name: 'Time Spent',
      href: `/case-profile/${id}/billing/hours`,
      displayChildren: true,
      icon: <TbClockDollar className="-ml-0.5 mr-2 h-5 w-5" />,
    },
    {
      name: 'Reimbursement',
      href: `/case-profile/${id}/billing/reimbursement`,
      displayChildren: true,
      icon: <TbFileDollar className="-ml-0.5 mr-2 h-5 w-5" />,
    },
  ]

  return (
    <div>
      <div className="max-w-5xl mb-5 bg-white mx-auto shadow-lg rounded-lg dark:bg-gray-950 p-4 dark:text-gray-50">
        <div className="flex items-stretch justify-between">
          <Tabs tabs={billingTabs}>
            <BillingData />
          </Tabs>
        </div>
        <div className="mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300">
          {children}
        </div>
      </div>
    </div>
  )
}
