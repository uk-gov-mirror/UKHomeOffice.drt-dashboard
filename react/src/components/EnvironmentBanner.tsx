import React from "react";

const getEnvironmentLabel = (url: string): string | null => {
    if (url.includes("drt.homeoffice")) return null;
    if (url.includes("drt-preprod.homeoffice")) return "PREPROD";
    if (url.includes("drt-staging.homeoffice")) return "STAGING";
    return "TEST";
};

export default function EnvironmentBanner() {
    const environment = getEnvironmentLabel(window.location.href);

    if (!environment) return null;


    return (
      <div className="has-alerts">
          <span className="the-alert alert-class-warning">
            {environment} - this is not production
          </span>
      </div>
    );
}

export { getEnvironmentLabel };