"use client";

import React from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";

export interface IDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  itemName: string;
  description?: string;
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<IDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  description,
  isLoading = false,
}) => {
  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      variant="danger"
      title={title}
      description={
        description ||
        `Tindakan ini akan menghapus "${itemName}" secara permanen. Data yang telah dihapus tidak dapat dipulihkan.`
      }
      confirmText="Ya, Hapus Sekarang"
      confirmVariant="danger"
      isConfirmLoading={isLoading}
      onConfirm={onConfirm}
      showCancelButton
      cancelText="Batal"
      maxWidth="sm"
    />
  );
};

export default DeleteConfirmModal;
