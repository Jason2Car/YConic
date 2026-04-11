import { EditWorkspace } from "@/components/editor/EditWorkspace";

interface EditPageProps {
    params: {
        projectId: string;
    };
}

export default function EditPage({ params }: EditPageProps) {
    // Project state is managed by the projectStore (Zustand)
    // In production, we'd hydrate the store from the database here
    return <EditWorkspace />;
}

export function generateMetadata({ params }: EditPageProps) {
    return {
        title: `Edit Project — Onboarding Builder`,
    };
}
