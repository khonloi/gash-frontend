'use client'

import React from "react";
import { AnnouncementBar } from "./AnnouncementBar/AnnouncementBar";
import { MainNavbar } from "./MainNavbar/MainNavbar";
import { UspBar } from "./UspBar/UspBar";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.stickyHeader}>
      <AnnouncementBar />
      <MainNavbar />
      <UspBar />
    </header>
  );
}
