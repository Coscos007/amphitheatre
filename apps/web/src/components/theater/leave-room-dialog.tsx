import { useTranslation } from "react-i18next";
import { Button } from "../ui/button.tsx";
import { Dialog } from "../ui/dialog.tsx";

type LeaveRoomDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LeaveRoomDialog({ open, onCancel, onConfirm }: LeaveRoomDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={t("theater.leaveConfirmTitle")}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {t("app.cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {t("theater.leaveConfirm")}
          </Button>
        </>
      }
    >
      <p>{t("theater.leaveConfirmBody")}</p>
    </Dialog>
  );
}
