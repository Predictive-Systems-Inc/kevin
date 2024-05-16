 
```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@ui/core/shadcn/tooltip'

import { Label } from '@ui/core/shadcn/label'
import React from 'react'
import { TbClockDollar } from 'react-icons/tb'
import { TbFileDollar } from 'react-icons/tb'

export default function BillingData() {
  return (
    <div className="flex flex-col items-end justify-center gap-2">
      <div className="flex flex-col items-end">
        <div className="flex items-center justify-between w-full">
          <span className="text-xl font-semibold">Total Time:</span>
          <span className="text-xl">00:00</span> {/* Placeholder for total time */}
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="text-xl font-semibold">Total Billing:</span>
          <span className="text-xl">$0.00</span> {/* Placeholder for total billing */}
        </div>
      </div>
    </div>
  )
}
```

