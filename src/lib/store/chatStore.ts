import { create } from "zustand";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    proposedChange?: ProposedChange;
}

export interface ProposedChange {
    type: string;
    description: string;
    status: "pending" | "approved" | "rejected";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
}

interface ChatStore {
    messages: ChatMessage[];
    isLoading: boolean;
    addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
    setLoading: (loading: boolean) => void;
    updateChangeStatus: (messageId: string, status: "approved" | "rejected") => void;
    clearMessages: () => void;
}

let messageCounter = 0;

export const useChatStore = create<ChatStore>((set) => ({
    messages: [
        {
            id: "welcome-msg",
            role: "assistant",
            content:
                "Hi! I'm your AI assistant powered by Gemini. I can help you build your onboarding project — add modules, update content, create diagrams, or add code exercises. What would you like to do?",
            timestamp: new Date(),
        },
    ],
    isLoading: false,

    addMessage: (message) => {
        messageCounter++;
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    ...message,
                    id: `msg-${Date.now()}-${messageCounter}`,
                    timestamp: new Date(),
                },
            ],
        }));
    },

    setLoading: (loading) => set({ isLoading: loading }),

    updateChangeStatus: (messageId, status) => {
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg.id === messageId && msg.proposedChange
                    ? { ...msg, proposedChange: { ...msg.proposedChange, status } }
                    : msg
            ),
        }));
    },

    clearMessages: () =>
        set({
            messages: [
                {
                    id: "welcome-msg",
                    role: "assistant",
                    content:
                        "Hi! I'm your AI assistant powered by Gemini. I can help you build your onboarding project — add modules, update content, create diagrams, or add code exercises. What would you like to do?",
                    timestamp: new Date(),
                },
            ],
        }),
}));
