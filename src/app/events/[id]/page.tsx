import EventDetails from "@/components/EventDetails";
import { Id } from "../../../../convex/_generated/dataModel";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <EventDetails id={id as Id<"events">} />;
}
