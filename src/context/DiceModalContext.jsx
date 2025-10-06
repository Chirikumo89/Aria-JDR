import { createContext, useContext, useState } from "react";

const DiceModalContext = createContext();

export const DiceModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);

  const show = () => {
    console.log("[DiceModalContext] show() appelé");
    setOpen(true);
  };
  const hide = () => {
    console.log("[DiceModalContext] hide() appelé");
    setOpen(false);
  };

  return (
    <DiceModalContext.Provider value={{ open, show, hide }}>
      {children}
    </DiceModalContext.Provider>
  );
};

export const useDiceModal = () => {
  const context = useContext(DiceModalContext);
  if (!context) throw new Error("useDiceModal doit être utilisé dans DiceModalProvider");
  return context;
};
