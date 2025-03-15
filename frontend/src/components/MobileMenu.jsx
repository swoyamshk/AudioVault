import React, { useEffect } from "react";

const MobileMenu = () => {
  useEffect(() => {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuButton && mobileMenu) {
      const toggleMenu = () => {
        mobileMenu.classList.toggle('hidden');
      };

      mobileMenuButton.addEventListener('click', toggleMenu);

      // Cleanup
      return () => {
        mobileMenuButton.removeEventListener('click', toggleMenu);
      };
    }
  }, []);

  return null;
};

export default MobileMenu;
