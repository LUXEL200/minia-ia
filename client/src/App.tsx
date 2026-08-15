import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
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
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import ThumbnailPreview from "./pages/ThumbnailPreview";
import Editor from "./pages/Editor";
import TemplateEditor from "./pages/TemplateEditor";
import AbTest from "./pages/AbTest";
import Admin from "./pages/Admin";

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
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/gallery"} component={Gallery} />
      <Route path={"/avatars"} component={Avatars} />
      <Route path={"/endcards"} component={EndCards} />
      <Route path={"/favorites"} component={Favorites} />
      <Route path={"/trash"} component={Trash} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/account"} component={Account} />
      <Route path={"/api-keys"} component={ApiKeys} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/billing"} component={Billing} />
      <Route path={"/preview"} component={ThumbnailPreview} />
      <Route path={"/editor"} component={Editor} />
      <Route path={"/template-editor"} component={TemplateEditor} />
      <Route path={"/ab-test"} component={AbTest} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
