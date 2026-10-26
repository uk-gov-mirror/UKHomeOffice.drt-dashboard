import React from "react";
import { render, screen } from "@testing-library/react";
import EnvironmentBanner, { getEnvironmentLabel } from "../../components/EnvironmentBanner";

describe("getEnvironmentLabel", () => {
    it("returns null for production urls", () => {
        expect(getEnvironmentLabel("https://abc.drt.homeoffice/dashboard")).toBeNull();
    });

    it("returns PREPROD for preprod urls", () => {
        expect(getEnvironmentLabel("https://abc.drt-preprod.homeoffice/dashboard")).toBe("PREPROD");
    });

    it("returns PREPROD for preprod urls with no prefix", () => {
        expect(getEnvironmentLabel("https://drt-preprod.homeoffice/dashboard")).toBe("PREPROD");
    });

    it("returns STAGING for staging urls", () => {
        expect(getEnvironmentLabel("https://abc.drt-staging.homeoffice/dashboard")).toBe("STAGING");
    });

    it("returns TEST for anything else", () => {
        expect(getEnvironmentLabel("https://localhost:3000")).toBe("TEST");
    });
});

describe("EnvironmentBanner", () => {
    const originalLocation = window.location;

    const setHref = (href: string) => {
        Object.defineProperty(window, "location", {
            value: { ...originalLocation, href },
            writable: true,
            configurable: true,
        });
    };

    afterEach(() => {
        Object.defineProperty(window, "location", {
            value: originalLocation,
            writable: true,
            configurable: true,
        });
    });

    it("does not render in production", () => {
        setHref("https://abc.drt.homeoffice/dashboard");
        const { container } = render(<EnvironmentBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders PREPROD banner", () => {
        setHref("https://abc.drt-preprod.homeoffice/dashboard");
        render(<EnvironmentBanner />);
        expect(screen.getByText("PREPROD - this is not production")).toBeInTheDocument();
    });

    it("renders STAGING banner", () => {
        setHref("https://abc.drt-staging.homeoffice/dashboard");
        render(<EnvironmentBanner />);
        expect(screen.getByText("STAGING - this is not production")).toBeInTheDocument();
    });

    it("renders TEST banner for other urls", () => {
        setHref("https://localhost:3000");
        render(<EnvironmentBanner />);
        expect(screen.getByText("TEST - this is not production")).toBeInTheDocument();
    });
});