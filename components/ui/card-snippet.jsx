"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "next-themes";
import { hslToHex, hexToRGB } from "@/lib/utils";
import { useThemeStore } from "@/store";

const CardSnippet = ({ title = undefined, code = undefined, children = undefined }) => {
  const [show, setShow] = useState(false);
  const toggle = () => {
    setShow(!show);
  };
  const { theme: mode } = useTheme();
  const { theme: config, setTheme: setConfig } = useThemeStore();
  // Ambil theme dari object themes, bukan pakai .find
  const availableTheme = themes[config] || themes.vsDark;

  // Jika availableTheme punya cssVars, gunakan, jika tidak, fallback ke default value
  const hslPrimary = availableTheme?.cssVars
    ? `hsla(${availableTheme.cssVars[mode === "dark" ? "dark" : "light"]["secondary-foreground"]})`
    : "#222";
  const hslPrimary2 = availableTheme?.cssVars
    ? `hsla(${availableTheme.cssVars[mode === "dark" ? "dark" : "light"].secondary})`
    : "#fff";

  const hexPrimary = hslToHex(hslPrimary);
  const hexPrimary2 = hslToHex(hslPrimary2);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        {title && <CardTitle className="flex-1 leading-normal"> {title}</CardTitle>}
        {code && (
          <div className="flex-none">
            <Switch id="airplane-mode" onClick={toggle} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
        <Collapsible open={show}>
          <CollapsibleContent className="CollapsibleContent">
            {code && (
              <Highlight
                theme={mode === "dark" ? themes.vsDark : themes.vsLight}
                code={code}
                language="javascript"
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={`${className} rounded-md text-sm mt-6 p-6`} style={{
                    ...style,
                    backgroundColor: mode !== "dark" ? hexPrimary : hexPrimary2,
                  }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default CardSnippet;
