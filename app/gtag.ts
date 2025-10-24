
export const GA_MEASUREMENT_ID = "G-69E4NQVPHB";


declare global {
    interface Window {
        gtag: (...args: any[]) => void;
    }
}

export const pageview = (url) => {
    window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: url,
    });
};

export const event = ({ action, params }) => {
    window.gtag("event", action, params);
};

