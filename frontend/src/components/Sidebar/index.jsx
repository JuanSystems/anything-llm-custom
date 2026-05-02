import React, { useEffect, useRef, useState } from "react";
import { List, Plus, CircleNotch } from "@phosphor-icons/react";
import NewWorkspaceModal, {
  useNewWorkspaceModal,
} from "../Modals/NewWorkspace";
import ActiveWorkspaces from "./ActiveWorkspaces";
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import Footer from "../Footer";
import SettingsButton from "../SettingsButton";
import { Link, useParams, useMatch } from "react-router-dom";
import paths from "@/utils/paths";
import { useTranslation } from "react-i18next";
import { useSidebarToggle, ToggleSidebarButton } from "./SidebarToggle";
import SearchBox from "./SearchBox";
import { Tooltip } from "react-tooltip";
import { createPortal } from "react-dom";
import showToast from "@/utils/toast";
import Workspace from "@/models/workspace";
import ThreadContainer from "./ActiveWorkspaces/ThreadContainer";
import { LAST_VISITED_WORKSPACE } from "@/utils/constants";
import { safeJsonParse } from "@/utils/request";




export default function Sidebar() {
  const { user } = useUser();
  const { logo } = useLogo();
  const sidebarRef = useRef(null);
  const { showSidebar, setShowSidebar, canToggleSidebar } = useSidebarToggle();
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();

  return (
    <>
      <div
        style={{
          width: showSidebar ? "292px" : "0px",
          paddingLeft: showSidebar ? "0px" : "16px",
        }}
        className="relative transition-all duration-500"
      >
        {canToggleSidebar && (
          <ToggleSidebarButton
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
          />
        )}
        <div className="overflow-hidden h-full">
          <div className="flex shrink-0 w-full justify-center my-[18px]">
            <div className="flex w-[250px] min-w-[250px]">
              <Link to={paths.home()} aria-label="Home">
                <img
                  src={logo}
                  alt="Logo"
                  className={`rounded max-h-[24px] object-contain transition-opacity duration-500 ${showSidebar ? "opacity-100" : "opacity-0"}`}
                />
              </Link>
            </div>
          </div>
          <div
            ref={sidebarRef}
            className="relative mx-[16px] mt-[16px] mb-[2px] rounded-[16px] bg-theme-bg-sidebar light:bg-slate-200 border-[2px] border-theme-sidebar-border light:border-none min-w-[250px] p-[10px] h-[calc(100%-48px)]"
          >
            <div className="flex flex-col h-full overflow-hidden min-w-[235px]">

   {/* FIJO: Nuevo Chat - PRIMERO */}
  <SidebarNewChatButton />
  
  {/* FIJO: Buscador */}
  <div className="flex-shrink-0 pt-[10px] pb-1">
    <SearchBox user={user} showNewWsModal={showNewWsModal} />
  </div>

  {/* FIJO: Workspaces */}
  <div className="flex-shrink-0">
    <ActiveWorkspaces showThreads={false} />
  </div>

  {/* SCROLLABLE: Threads */}
  <SidebarActiveSection />

  {/* FIJO: Footer */}
  <div className="flex-shrink-0 mt-auto pt-1">
  <Footer />
  </div>

</div>
          </div>
        </div>
        {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
      </div>
      <WorkspaceAndThreadTooltips />
    </>
  );
}

function SidebarNewChatButton() {
  const { t } = useTranslation();
  const { slug, threadSlug: currentThreadSlug } = useParams();
  const isHomePage = !!useMatch("/");
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const all = await Workspace.all();
      if (!all?.length) return;
      if (slug) {
        setActiveWorkspace(all.find((w) => w.slug === slug) || null);
        return;
      }
      if (isHomePage) {
        const lastVisited = safeJsonParse(localStorage.getItem(LAST_VISITED_WORKSPACE));
        setActiveWorkspace(
          (lastVisited?.slug ? all.find((w) => w.slug === lastVisited.slug) : null) || all[0]
        );
      }
    }
    load();
  }, [slug, isHomePage]);

  const handleNewThread = async () => {
    if (!activeWorkspace) return;
    setLoading(true);

    // Load existing threads to avoid creating duplicate blank ones
    const { threads } = await Workspace.threads.all(activeWorkspace.slug);
    const blankThreads = threads.filter((t) => t.name === "Nuevo chat");

    // If on a blank thread, inform the user
    if (currentThreadSlug && blankThreads.some((t) => t.slug === currentThreadSlug)) {
      setLoading(false);
      showToast("Ya tienes un chat sin mensajes", "info", { clear: true });
      return;
    }

    // If there are blank threads, navigate to the first one and inform the user
    if (blankThreads.length > 0) {
      setLoading(false);
      showToast("Ya existe un chat sin mensajes", "info", { clear: true });
      window.location.replace(
        paths.workspace.thread(activeWorkspace.slug, blankThreads[0].slug)
      );
      return;
    }

    const { thread, error } = await Workspace.threads.new(activeWorkspace.slug);
    if (error) {
      showToast(`No se pudo crear el chat - ${error}`, "error", { clear: true });
      setLoading(false);
      return;
    }
    window.location.replace(paths.workspace.thread(activeWorkspace.slug, thread.slug));
  };

  return (
    <div className="flex-shrink-0 px-1 pb-1">
      <button
        onClick={handleNewThread}
        disabled={!activeWorkspace || loading}
        className="w-full flex h-[42px] items-center justify-center gap-x-2 border border-white/20 hover:border-white/40 bg-transparent hover:bg-white/5 rounded-full transition-all duration-200 disabled:opacity-50"
      >
        {loading ? (
          <CircleNotch weight="bold" size={16} className="shrink-0 animate-spin text-white/70" />
        ) : (
          <div className="flex items-center justify-center w-[20px] h-[20px] rounded-full border border-white/40">
            <Plus weight="bold" size={12} className="text-white/80" />
          </div>
        )}
        <p className="text-white/80 text-sm font-medium">
          {loading ? "Iniciando..." : t("new-thread", "Nuevo chat")}
        </p>
      </button>
    </div>
  );
}

function SidebarActiveSection() {
  const { slug } = useParams();
  const isHomePage = !!useMatch("/");
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  useEffect(() => {
    async function load() {
      const all = await Workspace.all();
      if (!all?.length) return;
      if (slug) {
        setActiveWorkspace(all.find((w) => w.slug === slug) || null);
        return;
      }
      if (isHomePage) {
        const lastVisited = safeJsonParse(localStorage.getItem(LAST_VISITED_WORKSPACE));
        setActiveWorkspace(
          (lastVisited?.slug ? all.find((w) => w.slug === lastVisited.slug) : null) || all[0]
        );
      }
    }
    load();
  }, [slug, isHomePage]);

  return (
    <>
      {/* FIJO: Label del workspace activo */}
      {activeWorkspace && (
        <div className="flex-shrink-0 flex items-center gap-x-2 px-2 pt-3 pb-1 border-t border-white/10">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest truncate">
            {activeWorkspace.name}
          </p>
        </div>
      )}

      {/* SCROLLABLE: Threads */}
      <div className="flex-grow min-h-0 overflow-y-auto no-scroll">
        {activeWorkspace && (
          <ThreadContainer
            workspace={activeWorkspace}
            isActive={true}
            isVirtualThread={isHomePage && !slug}
          />
        )}
      </div>
    </>
  );
}

export function SidebarMobileHeader() {
  const { logo } = useLogo();
  const sidebarRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBgOverlay, setShowBgOverlay] = useState(false);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const { user } = useUser();

  useEffect(() => {
    function handleBg() {
      if (showSidebar) {
        setTimeout(() => {
          setShowBgOverlay(true);
        }, 300);
      } else {
        setShowBgOverlay(false);
      }
    }
    handleBg();
  }, [showSidebar]);

  return (
    <>
      <div
        aria-label="Show sidebar"
        className="fixed top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2 bg-theme-bg-sidebar light:bg-white text-slate-200 shadow-lg h-16"
      >
        <button
          onClick={() => setShowSidebar(true)}
          className="rounded-md p-2 flex items-center justify-center text-theme-text-secondary"
        >
          <List className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-center flex-grow">
          <img
            src={logo}
            alt="Logo"
            className="block mx-auto h-6 w-auto"
            style={{ maxHeight: "40px", objectFit: "contain" }}
          />
        </div>
        <div className="w-12"></div>
      </div>
      <div
        style={{
          transform: showSidebar ? `translateX(0vw)` : `translateX(-100vw)`,
        }}
        className={`z-99 fixed top-0 left-0 transition-all duration-500 w-[100vw] h-[100vh]`}
      >
        <div
          className={`${
            showBgOverlay
              ? "transition-all opacity-1"
              : "transition-none opacity-0"
          }  duration-500 fixed top-0 left-0 bg-theme-bg-secondary bg-opacity-75 w-screen h-screen`}
          onClick={() => setShowSidebar(false)}
        />
        <div
          ref={sidebarRef}
          className="relative h-[100vh] fixed top-0 left-0  rounded-r-[26px] bg-theme-bg-sidebar w-[80%] p-[18px] "
        >
          <div className="w-full h-full flex flex-col overflow-x-hidden items-between">
            <div className="flex w-full items-center justify-between gap-x-4">
              <div className="flex shrink-1 w-fit items-center justify-start">
                <img
                  src={logo}
                  alt="Logo"
                  className="rounded w-full max-h-[40px]"
                  style={{ objectFit: "contain" }}
                />
              </div>
              {(!user || user?.role !== "default") && (
                <div className="flex gap-x-2 items-center text-slate-500 shink-0">
                  <SettingsButton />
                </div>
              )}
            </div>
            <div className="h-full flex flex-col w-full justify-between pt-4 ">
              <div className="h-auto md:sidebar-items">
                <div className=" flex flex-col gap-y-4 overflow-y-scroll no-scroll pb-[60px]">
                  <NewWorkspaceButton
                    user={user}
                    showNewWsModal={showNewWsModal}
                  />
                  <ActiveWorkspaces />
                </div>
              </div>
              <div className="z-99 absolute bottom-0 left-0 right-0 pt-2 pb-6 rounded-br-[26px] bg-theme-bg-sidebar bg-opacity-80 backdrop-filter backdrop-blur-md">
                <Footer />
              </div>
            </div>
          </div>
        </div>
        {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
      </div>
    </>
  );
}

function NewWorkspaceButton({ user, showNewWsModal }) {
  const { t } = useTranslation();
  if (!!user && user?.role === "default") return null;

  return (
    <div className="flex gap-x-2 items-center justify-between">
      <button
        onClick={showNewWsModal}
        className="flex flex-grow w-[75%] h-[44px] gap-x-2 py-[5px] px-4 bg-white rounded-lg text-sidebar justify-center items-center hover:bg-opacity-80 transition-all duration-300"
      >
        <Plus className="h-5 w-5" />
        <p className="text-sidebar text-sm font-semibold">
          {t("new-workspace.title")}
        </p>
      </button>
    </div>
  );
}

function WorkspaceAndThreadTooltips() {
  return createPortal(
    <React.Fragment>
      <Tooltip
        id="workspace-name"
        place="right"
        delayShow={800}
        className="tooltip !text-xs z-99"
      />
      <Tooltip
        id="workspace-thread-name"
        place="right"
        delayShow={800}
        className="tooltip !text-xs z-99"
      />
      <Tooltip
        id="upload-workspace"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
      <Tooltip
        id="gear-workspace"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </React.Fragment>,
    document.body
  );
}