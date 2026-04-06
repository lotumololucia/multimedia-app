// vite.config.ts
import { defineConfig } from "file:///C:/Users/lucia/OneDrive/multimedia/app/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/lucia/OneDrive/multimedia/app/frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { viteSourceLocator } from "file:///C:/Users/lucia/OneDrive/multimedia/app/frontend/node_modules/@metagptx/vite-plugin-source-locator/dist/index.mjs";
import { atoms } from "file:///C:/Users/lucia/OneDrive/multimedia/app/frontend/node_modules/@metagptx/web-sdk/dist/plugins.js";
var __vite_injected_original_dirname = "C:\\Users\\lucia\\OneDrive\\multimedia\\app\\frontend";
function escapeHtmlAttr(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
process.env.VITE_APP_TITLE ??= process.env.OVERVIEW_TITLE ?? "shadcnui";
process.env.VITE_APP_DESCRIPTION ??= process.env.OVERVIEW_DESCRIPTION ?? "Atoms Generated Project";
process.env.VITE_APP_TITLE = escapeHtmlAttr(process.env.VITE_APP_TITLE);
process.env.VITE_APP_DESCRIPTION = escapeHtmlAttr(process.env.VITE_APP_DESCRIPTION);
process.env.VITE_APP_LOGO_URL ??= process.env.OVERVIEW_LOGO_URL ?? "https://public-frontend-cos.metadl.com/mgx/img/favicon_atoms.ico";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    viteSourceLocator({
      prefix: "mgx"
    }),
    react(),
    atoms()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.VITE_PORT || "3000"),
    proxy: {
      "/api": {
        target: `http://localhost:8000`,
        changeOrigin: true
      }
    },
    watch: { usePolling: true, interval: 600 }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom"],
          "router-vendor": ["react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip"
          ],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "utils-vendor": [
            "axios",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
            "date-fns",
            "lucide-react"
          ],
          "query-vendor": ["@tanstack/react-query"]
        }
      }
    },
    chunkSizeWarningLimit: 1e3
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxsdWNpYVxcXFxPbmVEcml2ZVxcXFxtdWx0aW1lZGlhXFxcXGFwcFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcbHVjaWFcXFxcT25lRHJpdmVcXFxcbXVsdGltZWRpYVxcXFxhcHBcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2x1Y2lhL09uZURyaXZlL211bHRpbWVkaWEvYXBwL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgdml0ZVNvdXJjZUxvY2F0b3IgfSBmcm9tICdAbWV0YWdwdHgvdml0ZS1wbHVnaW4tc291cmNlLWxvY2F0b3InO1xyXG5pbXBvcnQgeyBhdG9tcyB9IGZyb20gJ0BtZXRhZ3B0eC93ZWItc2RrL3BsdWdpbnMnO1xyXG5cclxuZnVuY3Rpb24gZXNjYXBlSHRtbEF0dHIoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHJldHVybiBzdHJcclxuICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXHJcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXHJcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXHJcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXHJcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcclxufVxyXG5cclxucHJvY2Vzcy5lbnYuVklURV9BUFBfVElUTEUgPz89IHByb2Nlc3MuZW52Lk9WRVJWSUVXX1RJVExFID8/ICdzaGFkY251aSc7XHJcbnByb2Nlc3MuZW52LlZJVEVfQVBQX0RFU0NSSVBUSU9OID8/PSBwcm9jZXNzLmVudi5PVkVSVklFV19ERVNDUklQVElPTiA/PyAnQXRvbXMgR2VuZXJhdGVkIFByb2plY3QnO1xyXG5wcm9jZXNzLmVudi5WSVRFX0FQUF9USVRMRSA9IGVzY2FwZUh0bWxBdHRyKHByb2Nlc3MuZW52LlZJVEVfQVBQX1RJVExFKTtcclxucHJvY2Vzcy5lbnYuVklURV9BUFBfREVTQ1JJUFRJT04gPSBlc2NhcGVIdG1sQXR0cihwcm9jZXNzLmVudi5WSVRFX0FQUF9ERVNDUklQVElPTik7XHJcbnByb2Nlc3MuZW52LlZJVEVfQVBQX0xPR09fVVJMID8/PSBwcm9jZXNzLmVudi5PVkVSVklFV19MT0dPX1VSTCA/PyAnaHR0cHM6Ly9wdWJsaWMtZnJvbnRlbmQtY29zLm1ldGFkbC5jb20vbWd4L2ltZy9mYXZpY29uX2F0b21zLmljbyc7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHZpdGVTb3VyY2VMb2NhdG9yKHtcclxuICAgICAgcHJlZml4OiAnbWd4JywgXHJcbiAgICB9KSxcclxuICAgIHJlYWN0KCksXHJcbiAgICBhdG9tcygpLFxyXG4gIF0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6ICcwLjAuMC4wJywgXHJcbiAgICBwb3J0OiBwYXJzZUludChwcm9jZXNzLmVudi5WSVRFX1BPUlQgfHwgJzMwMDAnKSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogYGh0dHA6Ly9sb2NhbGhvc3Q6ODAwMGAsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHdhdGNoOiB7IHVzZVBvbGxpbmc6IHRydWUsIGludGVydmFsOiA2MDAgfSxcclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgLy8gVmVuZG9yIGNodW5rc1xyXG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXHJcbiAgICAgICAgICAncm91dGVyLXZlbmRvcic6IFsncmVhY3Qtcm91dGVyLWRvbSddLFxyXG4gICAgICAgICAgJ3VpLXZlbmRvcic6IFtcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1hY2NvcmRpb24nLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWFsZXJ0LWRpYWxvZycsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYXNwZWN0LXJhdGlvJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1hdmF0YXInLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWNoZWNrYm94JyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1jb2xsYXBzaWJsZScsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtY29udGV4dC1tZW51JyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWhvdmVyLWNhcmQnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWxhYmVsJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1tZW51YmFyJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1uYXZpZ2F0aW9uLW1lbnUnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXBvcG92ZXInLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXByb2dyZXNzJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1yYWRpby1ncm91cCcsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2Nyb2xsLWFyZWEnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNlbGVjdCcsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2VwYXJhdG9yJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zbGlkZXInLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNsb3QnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXN3aXRjaCcsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdGFicycsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9hc3QnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvZ2dsZScsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9nZ2xlLWdyb3VwJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b29sdGlwJyxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICAnZm9ybS12ZW5kb3InOiBbJ3JlYWN0LWhvb2stZm9ybScsICdAaG9va2Zvcm0vcmVzb2x2ZXJzJywgJ3pvZCddLFxyXG4gICAgICAgICAgJ3V0aWxzLXZlbmRvcic6IFtcclxuICAgICAgICAgICAgJ2F4aW9zJyxcclxuICAgICAgICAgICAgJ2Nsc3gnLFxyXG4gICAgICAgICAgICAndGFpbHdpbmQtbWVyZ2UnLFxyXG4gICAgICAgICAgICAnY2xhc3MtdmFyaWFuY2UtYXV0aG9yaXR5JyxcclxuICAgICAgICAgICAgJ2RhdGUtZm5zJyxcclxuICAgICAgICAgICAgJ2x1Y2lkZS1yZWFjdCcsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgJ3F1ZXJ5LXZlbmRvcic6IFsnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5J10sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZVLFNBQVMsb0JBQW9CO0FBQzFXLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyxhQUFhO0FBSnRCLElBQU0sbUNBQW1DO0FBTXpDLFNBQVMsZUFBZSxLQUFxQjtBQUMzQyxTQUFPLElBQ0osUUFBUSxNQUFNLE9BQU8sRUFDckIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLFFBQVEsRUFDdEIsUUFBUSxNQUFNLE9BQU87QUFDMUI7QUFFQSxRQUFRLElBQUksbUJBQW1CLFFBQVEsSUFBSSxrQkFBa0I7QUFDN0QsUUFBUSxJQUFJLHlCQUF5QixRQUFRLElBQUksd0JBQXdCO0FBQ3pFLFFBQVEsSUFBSSxpQkFBaUIsZUFBZSxRQUFRLElBQUksY0FBYztBQUN0RSxRQUFRLElBQUksdUJBQXVCLGVBQWUsUUFBUSxJQUFJLG9CQUFvQjtBQUNsRixRQUFRLElBQUksc0JBQXNCLFFBQVEsSUFBSSxxQkFBcUI7QUFHbkUsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxTQUFTO0FBQUEsSUFDUCxrQkFBa0I7QUFBQSxNQUNoQixRQUFRO0FBQUEsSUFDVixDQUFDO0FBQUEsSUFDRCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTSxTQUFTLFFBQVEsSUFBSSxhQUFhLE1BQU07QUFBQSxJQUM5QyxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPLEVBQUUsWUFBWSxNQUFNLFVBQVUsSUFBSTtBQUFBLEVBQzNDO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLGdCQUFnQixDQUFDLFNBQVMsV0FBVztBQUFBLFVBQ3JDLGlCQUFpQixDQUFDLGtCQUFrQjtBQUFBLFVBQ3BDLGFBQWE7QUFBQSxZQUNYO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxlQUFlLENBQUMsbUJBQW1CLHVCQUF1QixLQUFLO0FBQUEsVUFDL0QsZ0JBQWdCO0FBQUEsWUFDZDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsZ0JBQWdCLENBQUMsdUJBQXVCO0FBQUEsUUFDMUM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsdUJBQXVCO0FBQUEsRUFDekI7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
