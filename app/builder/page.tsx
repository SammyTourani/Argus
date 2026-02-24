import { redirect } from 'next/navigation'

// /builder was a prototype mock — real builder is at /app → /generation
// Redirect anyone who navigates here to the actual product
export default function BuilderPage() {
  redirect('/app')
}
