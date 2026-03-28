import { create } from "zustand";

type ModalType = "confirmDelete" | "confirmDeactivate";

interface ModalData {
	userId?: string;
	userName?: string;
	departmentId?: string;
	departmentName?: string;
}

interface ModalStore {
	type: ModalType | null;
	data: ModalData;
	isOpen: boolean;
	onOpen: (type: ModalType, data?: ModalData) => void;
	onClose: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
	type: null,
	data: {},
	isOpen: false,
	onOpen: (type, data = {}) => set({ type, data, isOpen: true }),
	onClose: () => set({ type: null, data: {}, isOpen: false }),
}));
