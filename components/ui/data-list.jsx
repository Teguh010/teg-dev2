import React from 'react'
import * as DataList from '@radix-ui/react-data-list'



const DataListItem = ({ label, value, children, ...props }) => {
  return (
    <DataList.Item {...props}>
      <DataList.Label minWidth='88px'>{label}</DataList.Label>
      <DataList.Value>{value || children}</DataList.Value>
    </DataList.Item>
  )
}

export default DataListItem
