import React, { useState, useRef, useEffect } from 'react';
import VariableListItem from "./VariableListItem";
import variableIcon from '../assets/variable.svg';
import variableIconBrand from '../assets/variable-brand.svg';
import refreshIcon from '../assets/refresh.svg';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/ui.css';

function App() {
  const [variablesInUse, setVariablesInUse] = useState([]);
  const [loadingDone, setLoadingDone] = useState(false);
  const [showPreloader, setShowPreloader] = useState(false);

  const variablesInUseRef = useRef([]);
  const loadingDoneRef = useRef(false);

  const onFindVariables = () => {
    setLoadingDone(false);
    setShowPreloader(true);
    parent.postMessage({ pluginMessage: { type: 'find-variables' } }, '*');
  };

  React.useEffect(() => {
    window.onmessage = (event) => {
      const { type, message } = event.data.pluginMessage;
      if (type === 'variables-imported') {
        setVariablesInUse((prevVariablesInUse) => [...prevVariablesInUse, ...message.variables]);
        setLoadingDone(true);
      }
    };
  }, []);

  useEffect(() => {
    variablesInUseRef.current = variablesInUse;
  }, [variablesInUse]);

  useEffect(() => {
    loadingDoneRef.current = loadingDone;
  }, [loadingDone]);

  return (
    <div>
      {!loadingDone ? (
        <div className="page">
          <AnimatePresence>
            {!showPreloader ? (
              <motion.div className="initial-state"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                key="inital-state"
              >
                <motion.img
                  src={variableIcon}
                />
                <p className="paragraph">Scan your page to find which variables are being used by different layers.</p>
                <button className="button" onClick={onFindVariables}>
                  Find Variables
                </button>
              </motion.div>
            ) : (
              <div className="loading-state"
                key="loading-state"
              >
                <img
                  src={variableIconBrand}
                  className="loading-icon"
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div>
          {variablesInUse.length === 0 ? (
            <div className="page">
              <div className="empty-state">
                <p className="paragraph">Hmm, we couldn't find any variables being used on this page. Navigate to a new page and try again.</p>
                <button className="button" onClick={onFindVariables}>
                  Find Variables
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="title-wrapper">
                <h3 className="table-header border-right">Name</h3>
                <h3 className="table-header">Mode 1</h3>
              </div>
              <ul className="variable-list">
                {variablesInUse.map((variable, index) => (
                  <VariableListItem key={index} variable={variable} />
                ))}
              </ul>
              <motion.div className="refresh" onClick={onFindVariables} whileTap={{ scale: 0.98, opacity: 0.8 }}>
                <motion.img
                  src={refreshIcon}
                />
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
