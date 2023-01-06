import React, { createContext, PropsWithChildren, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import { AlertColor } from "@mui/material";

type SnackbarContextType = {
  open: (text: string, type: AlertColor) => void;
};

export const SnackbarContext = createContext<SnackbarContextType | null>(null);

export const SnackbarProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<AlertColor>("success");

  const open = (text: string, type: AlertColor) => {
    setText(text);
    setType(type);
    setIsOpen(true);
  };

  const value = { open };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        key={text}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        open={isOpen}
        autoHideDuration={4000}
        onClose={() => setIsOpen(false)}
      >
        <Alert onClose={() => setIsOpen(false)} variant="filled" severity={type}>
          {text}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
