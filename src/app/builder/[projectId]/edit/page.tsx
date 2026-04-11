import { EditWorkspace } from "@/components/editor/EditWorkspace";

interface EditPageProps {
    params: {
        projectId: string;
    };
}

export default function EditPage({ params }: EditPageProps) {
    return <EditWorkspace projectId={params.projectId} />;
}

export function generateMetadata() {
    return {
        title: "Edit Project — Onboarding Builder",
    };
}
