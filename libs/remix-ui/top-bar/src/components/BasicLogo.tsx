import React from 'react'
export default function BasicLogo({ classList = '', solid = true }: { classList?: string; solid?: boolean }) {
  return <img src="assets/ootle/mark.svg" alt="Ootle Workbench" className={classList} width="35" height="35" />
}
