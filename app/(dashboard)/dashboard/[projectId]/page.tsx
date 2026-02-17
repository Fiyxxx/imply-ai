import { redirect } from 'next/navigation'

interface ProjectPageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({
  params,
}: ProjectPageProps): Promise<never> {
  const { projectId } = await params
  redirect(`/dashboard/${projectId}/agent`)
}
