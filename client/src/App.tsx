import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ActionEffectsProvider } from "./components/ActionEffects";
import { DownloadEffectsProvider } from "./components/DownloadEffects";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Miniatures from "./pages/Miniatures";
import Personnes from "./pages/Personnes";
import Gallery from "./pages/Gallery";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Templates from "./pages/Templates";
import Generator from "./pages/Generator";
import Faq from "./pages/Faq";
import Docs from "./pages/Docs";
import Blog from "./pages/Blog";
import Models from "./pages/Models";
import BestPractices from "./pages/BestPractices";
import Examples from "./pages/Examples";
import Comparisons from "./pages/Comparisons";
import ForCreators from "./pages/ForCreators";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Cgv from "./pages/Cgv";
import Avatars from "./pages/Avatars";
import EndCards from "./pages/EndCards";
import Favorites from "./pages/Favorites";
import Trash from "./pages/Trash";
import Notifications from "./pages/Notifications";
import Account from "./pages/Account";
import ApiKeys from "./pages/ApiKeys";
import Organization from "./pages/Organization";
import Invitations from "./pages/Invitations";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import ThumbnailPreview from "./pages/ThumbnailPreview";
import Editor from "./pages/Editor";
import TemplateEditor from "./pages/TemplateEditor";
import AbTest from "./pages/AbTest";
import ShareAbTest from "./pages/ShareAbTest";
import Admin from "./pages/Admin";
import BatchUpload from "./pages/BatchUpload";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import type { ComponentType } from "react";

function privatePage(Page: ComponentType) {
  return function ProtectedPage() {
    return (
      <ProtectedRoute>
        <AppShell>
          <Page />
        </AppShell>
      </ProtectedRoute>
    );
  };
}

const DashboardRoute = privatePage(Dashboard);
const MiniaturesRoute = privatePage(Miniatures);
const PersonnesRoute = privatePage(Personnes);
const GalleryRoute = privatePage(Gallery);
const AvatarsRoute = privatePage(Avatars);
const EndCardsRoute = privatePage(EndCards);
const FavoritesRoute = privatePage(Favorites);
const TrashRoute = privatePage(Trash);
const NotificationsRoute = privatePage(Notifications);
const AccountRoute = privatePage(Account);
const ApiKeysRoute = privatePage(ApiKeys);
const OrganizationRoute = privatePage(Organization);
const InvitationsRoute = privatePage(Invitations);
const SettingsRoute = privatePage(Settings);
const BillingRoute = privatePage(Billing);
const ThumbnailPreviewRoute = privatePage(ThumbnailPreview);
const EditorRoute = privatePage(Editor);
const TemplateEditorRoute = privatePage(TemplateEditor);
const AbTestRoute = privatePage(AbTest);
const BatchUploadRoute = privatePage(BatchUpload);
const AdminRoute = privatePage(Admin);

function Router() {
  return (
    <Switch>
      {/* Home */}
      <Route path={"/"} component={Home} />
      {/* Produit */}
      <Route path={"/features"} component={Features} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/generator"} component={Generator} />
      <Route path={"/faq"} component={Faq} />
      <Route path={"/docs"} component={Docs} />
      {/* Ressources */}
      <Route path={"/blog"} component={Blog} />
      <Route path={"/models"} component={Models} />
      <Route path={"/best-practices"} component={BestPractices} />
      <Route path={"/examples"} component={Examples} />
      <Route path={"/comparisons"} component={Comparisons} />
      <Route path={"/for-creators"} component={ForCreators} />
      {/* Légal */}
      <Route path={"/terms"} component={Terms} />
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/cgv"} component={Cgv} />
      {/* Auth */}
      <Route path={"/dashboard"} component={DashboardRoute} />
      <Route path={"/miniatures"} component={MiniaturesRoute} />
      <Route path={"/personnes"} component={PersonnesRoute} />
      <Route path={"/gallery"} component={GalleryRoute} />
      <Route path={"/avatars"} component={AvatarsRoute} />
      <Route path={"/endcards"} component={EndCardsRoute} />
      <Route path={"/favorites"} component={FavoritesRoute} />
      <Route path={"/trash"} component={TrashRoute} />
      <Route path={"/notifications"} component={NotificationsRoute} />
      <Route path={"/account"} component={AccountRoute} />
      <Route path={"/api-keys"} component={ApiKeysRoute} />
      <Route path={"/organisation"} component={OrganizationRoute} />
      <Route path={"/invitations"} component={InvitationsRoute} />
      <Route path={"/settings"} component={SettingsRoute} />
      <Route path={"/billing"} component={BillingRoute} />
      <Route path={"/preview"} component={ThumbnailPreviewRoute} />
      <Route path={"/editor"} component={EditorRoute} />
      <Route path={"/template-editor"} component={TemplateEditorRoute} />
      <Route path={"/ab-test"} component={AbTestRoute} />
      <Route path={"/share-ab/:token"} component={ShareAbTest} />
      <Route path={"/batch-upload"} component={BatchUploadRoute} />
      <Route path={"/admin"} component={AdminRoute} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme={(typeof window !== "undefined" && (new URLSearchParams(window.location.search).get("theme") === "light" ? "light" : "dark")) as "light" | "dark"}
        switchable={true}
      >
        <ActionEffectsProvider>
          <DownloadEffectsProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
          </DownloadEffectsProvider>
        </ActionEffectsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
