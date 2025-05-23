import ChatClient from './page.client';

// Keep it extremely simple
export default function ChatPage({ params }: { params: { id: string } }) {
  return <ChatClient id={params.id} />;
}
