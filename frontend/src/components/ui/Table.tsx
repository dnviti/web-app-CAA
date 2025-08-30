import React from 'react'
import { clsx } from 'clsx'

interface TableProps {
  children: React.ReactNode
  className?: string
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
  header?: boolean
}

export const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('min-w-full bg-white border border-gray-200 rounded-lg', className)}>
        {children}
      </table>
    </div>
  )
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={clsx('bg-gray-50 border-b border-gray-200', className)}>
      {children}
    </thead>
  )
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={clsx('divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  )
}

export const TableRow: React.FC<TableRowProps> = ({ children, className, onClick }) => {
  return (
    <tr 
      className={clsx(
        'hover:bg-gray-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export const TableCell: React.FC<TableCellProps> = ({ children, className, header = false }) => {
  const Component = header ? 'th' : 'td'
  
  return (
    <Component
      className={clsx(
        'px-6 py-4 text-left',
        header 
          ? 'text-xs font-medium text-gray-500 uppercase tracking-wider'
          : 'text-sm text-gray-900',
        className
      )}
    >
      {children}
    </Component>
  )
}
