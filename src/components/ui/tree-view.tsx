import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface TreeDataItem {
  id: string
  name: string
  icon?: React.ReactNode
  children?: TreeDataItem[]
  onClick?: () => void
  selected?: boolean
}

interface TreeViewProps {
  data: TreeDataItem[]
  initialSelectedItemId?: string
  onSelectChange?: (item: TreeDataItem) => void
  className?: string
}

export function TreeView({
  data,
  initialSelectedItemId,
  onSelectChange,
  className,
}: TreeViewProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())
  const [selectedItemId, setSelectedItemId] = React.useState<string | undefined>(initialSelectedItemId)

  const handleToggle = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const handleSelect = (item: TreeDataItem) => {
    setSelectedItemId(item.id)
    if (onSelectChange) {
      onSelectChange(item)
    }
    if (item.onClick) {
      item.onClick()
    }
  }

  const renderItem = (item: TreeDataItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const isSelected = selectedItemId === item.id

    return (
      <div key={item.id} className="space-y-1">
        <div
          className={cn(
            "flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer",
            isSelected && "bg-muted"
          )}
          style={{ paddingLeft: `${level * 16}px` }}
          onClick={() => handleSelect(item)}
        >
          <div className="flex items-center space-x-2">
            {hasChildren && (
              <button
                className="h-4 w-4 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggle(item.id)
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {item.icon}
            <span>{item.name}</span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {item.children?.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-1", className)}>
      {data.map((item) => renderItem(item))}
    </div>
  )
} 