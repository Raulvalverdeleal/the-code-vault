import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext({
    forcedRenders: 0,
    screen: {width: window.innerWidth, height: window.innerHeight},
    forceRender: () => {},
    setScreen: () => {},
});

export const AppProvider = ({ children }) => {

    const [forcedRenders, setForcedRenders] = useState(0)
    const [screen, setScreen] = useState({width: window.innerWidth, height: window.innerHeight})

    const forceRender = useCallback(() => setForcedRenders((x) => x + 1), [])

    return (
        <AppContext.Provider value={{
            forcedRenders,
            forceRender,
            screen,
            setScreen
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext)