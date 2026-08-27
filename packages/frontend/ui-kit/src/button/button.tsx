import type {ButtonHTMLAttributes} from 'react'

export function Button({type = 'button', ...props}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} {...props} />
}
