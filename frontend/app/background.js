"use client";
import React from "react";
import styles from "./background.module.css";
import Spline from "@splinetool/react-spline";

const Background = () => {
    return (
        <Spline
            scene="https://prod.spline.design/TUFzW6NrUlVBSDUk/scene.splinecode"
            className={styles.canvas}
        />
    );
};

export default Background;