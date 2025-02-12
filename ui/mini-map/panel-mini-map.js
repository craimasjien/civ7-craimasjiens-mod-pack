/**
 * @file panel-mini-map.ts
 * @copyright 2021 - 2024, Firaxis Games
 * @description Mini-map panel, and lens/pennant dispaly
 */
import MiniMapData from '/base-standard/ui/mini-map/model-mini-map.js';
import { CursorUpdatedEventName } from '/core/ui/input/cursor.js';
import ContextManager, { ContextManagerEvents } from '/core/ui/context-manager/context-manager.js';
import FocusManager from '/core/ui/input/focus-manager.js';
import { InputEngineEventName } from '/core/ui/input/input-support.js';
import LensManager, { LensLayerDisabledEventName, LensLayerEnabledEventName, LensActivationEventName } from '/core/ui/lenses/lens-manager.js';
import Panel from '/core/ui/panel-support.js';
import Databind from '/core/ui/utilities/utilities-core-databinding.js';
import ViewManager from '/core/ui/views/view-manager.js';
import ActionHandler, { ActiveDeviceTypeChangedEventName } from '/core/ui/input/action-handler.js';
import { Audio } from '/core/ui/audio-base/audio-support.js';
import { SocialPanelOpenEventName } from '/core/ui/shell/mp-staging/mp-friends.js';
export class PanelMiniMap extends Panel {
    constructor(root) {
        super(root);
        this.SMALL_SCREEN_MODE_MAX_HEIGHT = 768;
        this.SMALL_SCREEN_MODE_MAX_WIDTH = 1800;
        this.chatPanelState = false;
        this.lensPanelState = false;
        this.miniMapChatButton = this.createMinimapChatButton();
        this.miniMapLensButton = this.createMinimapLensButton();
        this.miniMapRadialButton = this.createMinimapRadialButton();
        this.lensRadioButtonContainer = document.createElement('fxs-spatial-slot');
        this.lensElementMap = {};
        this.layerCheckboxContainer = document.createElement('fxs-spatial-slot');
        this.layerElementMap = {};
        this.lensRadioButtons = [];
        this.miniMapTopContainer = document.createElement("fxs-vslot");
        this.setWorldFocusOnClose = true;
        this.chatPanelNavHelp = document.createElement('div');
        this.radialNavHelpContainer = document.createElement('div');
        this.toggleLensActionNavHelp = document.createElement("fxs-nav-help");
        this.chatPanel = document.createElement('div');
        this.lensPanel = document.createElement('fxs-vslot');
        this.mapHighlight = document.createElement('div');
        this.mapImage = null;
        this.mapLastCursor = null;
        this.lastCursorPos = { x: 0, y: 0 };
        this.lastMinimapPos = { x: 0, y: 0 };
        this.mapHeight = 0;
        this.mapWidth = 0;
        this.mapTopBorderTiles = 2;
        this.mapBottomBorderTiles = 2;
        this.showHighlightListener = this.onShowHighlight.bind(this);
        this.hideHighlightListener = this.onHideHighlight.bind(this);
        this.onActiveLensChangedListener = this.onActiveLensChanged.bind(this);
        this.resizeListener = this.onResize.bind(this);
        this.activeDeviceTypeListener = this.onActiveDeviceTypeChanged.bind(this);
        this.minimapImageEngineInputListener = this.onMinimapImageEngineInput.bind(this);
        this.engineInputListener = this.onEngineInput.bind(this);
        this.cursorUpdatedListener = this.onCursorUpdated.bind(this);
        this.socialPanelOpenedListener = this.onSocialPanelOpened.bind(this);
        this.miniMapLensDisplayOptionName = "minimap_set_lens";
        this.onFocusOut = ({ relatedTarget }) => {
            if (this.lensPanelState && !(relatedTarget instanceof Node && this.Root.contains(relatedTarget)) && !this.Root.contains(FocusManager.getFocus())) {
                this.setWorldFocusOnClose = false; // don't set world focus if we close the panel because the focused changed.
                const toggle = this.toggleLensPanel();
                this.miniMapLensButton?.classList.toggle('mini-map__button--selected', toggle);
            }
            if (this.chatPanelState && !(relatedTarget instanceof Node && this.Root.contains(relatedTarget)) && !this.Root.contains(FocusManager.getFocus())) {
                this.setWorldFocusOnClose = false; // don't set world focus if we close the panel because the focused changed.
                const toggle = this.toggleChatPanel();
                this.miniMapChatButton?.classList.toggle('mini-map__button--selected', toggle);
            }
        };
        this.onLensChange = (event) => {
            const { isChecked, value: lens } = event.detail;
            if (isChecked) {
                LensManager.setActiveLens(lens);
                MiniMapData.setLensDisplayOption(this.miniMapLensDisplayOptionName, lens);
            }
        };
        /**
         * Expand or collapse the chat panel
         * @returns true if panel should be expanded
         */
        this.toggleChatPanel = () => {
            if (!Configuration.getGame().isAnyMultiplayer || !Network.hasCommunicationsPrivilege(false)) {
                return false;
            }
            this.chatPanelState = !this.chatPanelState;
            this.miniMapChatButton.setAttribute('data-audio-press-ref', this.chatPanelState ?
                'data-audio-minimap-panel-close-press'
                : 'data-audio-minimap-panel-open-press');
            this.chatPanel.classList.toggle("scale-0", !this.chatPanelState);
            this.updateChatNavHelp();
            if (ContextManager.hasInstanceOf("screen-mp-chat")) {
                setTimeout(() => {
                    ContextManager.pop("screen-mp-chat");
                }, 250);
                Input.setActiveContext(InputContext.World);
                ViewManager.getHarness()?.classList.add("trigger-nav-help");
            }
            else {
                if (this.lensPanelState) {
                    this.toggleLensPanel();
                }
                const chatPanel = ContextManager.push("screen-mp-chat", { singleton: true, createMouseGuard: false, targetParent: this.chatPanel });
                chatPanel.classList.add("w-full", "h-full");
                Input.setActiveContext(InputContext.Shell);
                ViewManager.getHarness()?.classList.remove("trigger-nav-help");
            }
            this.setWorldFocusOnClose = true;
            return this.chatPanelState;
        };
        /**
         * Expand or collapse the lens panel
         * @returns true if panel should be expanded
         */
        this.toggleLensPanel = () => {
            this.lensPanelState = !this.lensPanelState;
            this.lensPanel.classList.toggle('scale-0', !this.lensPanelState);
            this.lensPanel.classList.toggle('h-0', !this.lensPanelState);
            this.updateChatNavHelp();
            const activateId = this.lensPanelState ?
                'data-audio-minimap-panel-open-release'
                : 'data-audio-minimap-panel-close-release';
            Audio.playSound(activateId, "audio-panel-mini-map");
            // Set open and close press/release sounds based on the lens Panel State
            this.miniMapLensButton.setAttribute('data-audio-press-ref', this.lensPanelState ?
                'data-audio-minimap-panel-close-press'
                : 'data-audio-minimap-panel-open-press');
            const radioButtons = Object.values(this.lensElementMap);
            for (const radioButton of radioButtons) {
                if (this.lensPanelState) {
                    radioButton.removeAttribute('disabled');
                }
                else {
                    radioButton.setAttribute('disabled', "true");
                }
            }
            for (const checkbox of Object.values(this.layerElementMap)) {
                if (this.lensPanelState) {
                    checkbox.removeAttribute('disabled');
                }
                else {
                    checkbox.setAttribute('disabled', "true");
                }
            }
            if (this.lensPanelState) {
                if (this.chatPanelState) {
                    this.toggleChatPanel();
                }
                if (radioButtons.length > 0) {
                    Input.setActiveContext(InputContext.Shell);
                    ViewManager.getHarness()?.classList.remove("trigger-nav-help");
                    this.lensPanel.classList.add("trigger-nav-help");
                    FocusManager.setFocus(radioButtons[0]);
                }
            }
            else if (this.setWorldFocusOnClose) {
                Input.setActiveContext(InputContext.World);
                ViewManager.getHarness()?.classList.add("trigger-nav-help");
                this.lensPanel.classList.remove("trigger-nav-help");
                FocusManager.SetWorldFocused();
            }
            this.setWorldFocusOnClose = true;
            return this.lensPanelState;
        };
        this.onLensLayerEnabled = (event) => {
            const checkbox = this.layerElementMap[event.detail.layer];
            checkbox?.setAttribute('selected', 'true');
        };
        this.onLensLayerDisabled = (event) => {
            const checkbox = this.layerElementMap[event.detail.layer];
            checkbox?.setAttribute('selected', 'false');
        };
        this.animateInType = this.animateOutType = 15 /* AnchorType.Auto */;
        this.mapHeight = GameplayMap.getGridHeight();
        this.mapWidth = GameplayMap.getGridWidth();
    }
    onInitialize() {
        const container = document.createElement("fxs-vslot");
        container.setAttribute("reverse-navigation", "");
        container.setAttribute("focus-rule", "last");
        container.classList.add("mini-map-container");
        this.Root.appendChild(container);
        // Lens panel creation
        this.lensPanel.setAttribute('data-navrule-up', 'stop');
        this.lensPanel.setAttribute('data-navrule-down', 'stop');
        this.lensPanel.setAttribute('data-navrule-right', 'stop');
        this.lensPanel.setAttribute('data-navrule-left', 'stop');
        this.lensPanel.classList.add("mini-map__lens-panel", "scale-0", "left-3", "px-2", "py-8");
        const closeLensPanelNavHelp = document.createElement("fxs-nav-help");
        closeLensPanelNavHelp.setAttribute("action-key", "inline-cancel");
        closeLensPanelNavHelp.classList.add("absolute", "-right-4", "-top-3", "z-1");
        Databind.classToggle(closeLensPanelNavHelp, "hidden", "!{{g_NavTray.isTrayRequired}}");
        this.lensPanel.appendChild(closeLensPanelNavHelp);
        const lensPanelContent = document.createElement("div");
        lensPanelContent.classList.add("mb-5");
        this.lensPanel.appendChild(lensPanelContent);
        const lensPanelHeader = document.createElement("fxs-header");
        lensPanelHeader.classList.add("mb-3", "font-title-base", "text-secondary");
        lensPanelHeader.setAttribute('title', 'LOC_UI_MINI_MAP_LENSES');
        lensPanelHeader.setAttribute('filigree-style', 'h4');
        lensPanelContent.appendChild(lensPanelHeader);
        this.lensRadioButtonContainer.className = 'relative flex flex-wrap row items-start justify-start';
        lensPanelContent.appendChild(this.lensRadioButtonContainer);
        // Decorations panel creation
        const decorPanelContent = document.createElement("div");
        decorPanelContent.classList.add("mini-map__decor-panel-content");
        this.lensPanel.appendChild(decorPanelContent);
        const decorPanelHeader = document.createElement("fxs-header");
        decorPanelHeader.classList.add("mb-3", "font-title-base", "text-secondary");
        decorPanelHeader.setAttribute('title', 'LOC_UI_MINI_MAP_DECORATION');
        decorPanelHeader.setAttribute('filigree-style', 'h4');
        decorPanelContent.appendChild(decorPanelHeader);
        this.layerCheckboxContainer.className = 'relative flex flex-wrap row items-start justify-start';
        decorPanelContent.appendChild(this.layerCheckboxContainer);
        // Visibility panel creation
        const visibilityPanelContent = document.createElement("div");
        visibilityPanelContent.classList.add("fxs-vslot");
        this.lensPanel.appendChild(visibilityPanelContent);
        const visibilityDivider = document.createElement("div");
        visibilityDivider.classList.add("filigree-divider-inner-frame");
        visibilityPanelContent.appendChild(visibilityDivider);
        visibilityPanelContent.appendChild(this.createShowMinimapCheckbox());
        // Mini-Map creation
        this.miniMapTopContainer.classList.add("mini-map__main");
        this.miniMapTopContainer.setAttribute("ignore-prior-focus", "");
        this.miniMapTopContainer.setAttribute("id", "mm-top-container");
        this.mapImage = document.createElement("div");
        this.mapImage.role = "tooltip";
        this.mapImage.classList.add('mini-map__image');
        this.mapImage.setAttribute("data-tooltip-content", Locale.compose("LOC_UI_MINI_MAP_CLICK_TO_NAVIGATE"));
        this.mapImage.setAttribute("data-audio-group-ref", "audio-panel-mini-map");
        this.mapImage.setAttribute("data-audio-activate-ref", "data-audio-minimap-clicked-map");
        this.miniMapTopContainer.appendChild(this.mapImage);
        this.mapImage.addEventListener(InputEngineEventName, this.minimapImageEngineInputListener);
        window.addEventListener(CursorUpdatedEventName, this.cursorUpdatedListener);
        // Lens Button initial press/release sounds
        this.miniMapLensButton.setAttribute('data-audio-group-ref', 'audio-panel-mini-map');
        this.miniMapLensButton.setAttribute('data-audio-press-ref', 'data-audio-minimap-panel-open-press');
        this.miniMapButtonRow = document.createElement("div");
        this.miniMapButtonRow.classList.add("mini-map__button-row");
        this.toggleLensActionNavHelp.setAttribute("action-key", "inline-open-lens-panel");
        this.toggleLensActionNavHelp.classList.add("absolute", "top-1");
        this.miniMapLensButton.appendChild(this.toggleLensActionNavHelp);
        this.miniMapButtonRow.appendChild(this.miniMapLensButton);
        this.miniMapTopContainer.appendChild(this.miniMapButtonRow);
        container.appendChild(this.lensPanel);
        container.appendChild(this.miniMapTopContainer);
        // Chat panel creation
        if (Configuration.getGame().isAnyMultiplayer && Network.hasCommunicationsPrivilege(false)) {
            this.miniMapChatButton.setAttribute('data-audio-group-ref', 'audio-panel-mini-map');
            this.miniMapChatButton.setAttribute('data-audio-press-ref', 'data-audio-minimap-panel-open-press');
            this.miniMapButtonRow.appendChild(this.miniMapChatButton);
            const closeChatNavHelp = document.createElement("fxs-nav-help");
            closeChatNavHelp.setAttribute("action-key", "inline-cancel");
            closeChatNavHelp.classList.add("absolute", "-right-4", "-top-3", "z-1");
            this.chatPanel.appendChild(closeChatNavHelp);
            this.chatPanel.classList.add("mini-map__chat-panel", "scale-0", "absolute", "pl-3", "pb-2", "bottom-56", "pointer-events-none");
            const openChatNavHelp = document.createElement("fxs-nav-help");
            openChatNavHelp.setAttribute("action-key", "inline-toggle-chat");
            openChatNavHelp.setAttribute("decoration-mode", "border");
            openChatNavHelp.setAttribute("caption", "LOC_UI_CHAT_PANEL");
            this.chatPanelNavHelp.appendChild(openChatNavHelp);
            this.chatPanelNavHelp.classList.add("flow-row", "fxs-nav-help", "absolute", "left-full", "bottom-4");
            Databind.classToggle(this.chatPanelNavHelp, "hidden", "!{{g_NavTray.isTrayRequired}}");
            this.miniMapTopContainer.appendChild(this.chatPanelNavHelp);
            container.appendChild(this.chatPanel);
        }
        this.miniMapButtonRow.appendChild(this.miniMapRadialButton);
        this.radialNavHelpContainer.classList.add("absolute", "left-14", "top-1");
        const radialActionNavHelp = document.createElement("fxs-nav-help");
        radialActionNavHelp.setAttribute("action-key", "inline-toggle-radial-menu");
        this.radialNavHelpContainer.appendChild(radialActionNavHelp);
        this.miniMapRadialButton.appendChild(this.radialNavHelpContainer);
        this.createLensButton("LOC_UI_MINI_MAP_NONE", 'fxs-default-lens', "lens-group");
        this.createLensButton("LOC_UI_MINI_MAP_SETTLER", 'fxs-settler-lens', "lens-group");
        // this.createLayerButton("LOC_UI_MINI_MAP_RELIGION", "", "lens-group");
        this.createLensButton("LOC_UI_MINI_MAP_RELIGION", "cmp-religion-lens", "lens-group");
        this.createLensButton("LOC_UI_MINI_MAP_CONTINENT", "fxs-continent-lens", "lens-group");
        // this.createLayerButton("LOC_UI_MINI_MAP_GOVERNMENT", "", "lens-group");
        // this.createLayerButton("LOC_UI_MINI_MAP_POLITICAL", "", "lens-group");
        // this.createLayerButton("LOC_UI_MINI_MAP_EMPIRE", "", "lens-group");
        // this.createLayerButton("LOC_UI_MINI_MAP_TRADE", "", "lens-group");
        this.createLayerCheckbox("LOC_UI_MINI_MAP_HEX_GRID", "fxs-hexgrid-layer");
        this.createLayerCheckbox("LOC_UI_MINI_MAP_RESOURCE", "fxs-resource-layer");
        this.createLayerCheckbox("LOC_UI_MINI_MAP_YIELDS", "fxs-yields-layer");
        this.updateRadialButton();
        this.updateLensButton();
        this.updateRadialNavHelpContainer();
        this.updateLensActionNavHelp();
    }
    onAttach() {
        super.onAttach();
        engine.on(ContextManagerEvents.OnChanged, this.onContextChange, this);
        this.Root.addEventListener(InputEngineEventName, this.engineInputListener);
        window.addEventListener(CursorUpdatedEventName, this.cursorUpdatedListener);
        window.addEventListener(SocialPanelOpenEventName, this.socialPanelOpenedListener);
        window.addEventListener('resize', this.resizeListener);
        window.addEventListener(ActiveDeviceTypeChangedEventName, this.activeDeviceTypeListener);
        window.addEventListener(LensActivationEventName, this.onActiveLensChangedListener);
        window.addEventListener(LensLayerEnabledEventName, this.onLensLayerEnabled);
        window.addEventListener(LensLayerDisabledEventName, this.onLensLayerDisabled);
        window.addEventListener('minimap-show-highlight', this.showHighlightListener);
        window.addEventListener('minimap-hide-highlight', this.hideHighlightListener);
    }
    onDetach() {
        engine.off(ContextManagerEvents.OnChanged, this.onContextChange, this);
        this.Root.removeEventListener(InputEngineEventName, this.engineInputListener);
        window.removeEventListener(CursorUpdatedEventName, this.cursorUpdatedListener);
        window.removeEventListener(SocialPanelOpenEventName, this.socialPanelOpenedListener);
        window.removeEventListener('resize', this.resizeListener);
        window.removeEventListener(ActiveDeviceTypeChangedEventName, this.activeDeviceTypeListener);
        window.removeEventListener(LensActivationEventName, this.onActiveLensChangedListener);
        window.removeEventListener(LensLayerEnabledEventName, this.onLensLayerEnabled);
        window.removeEventListener(LensLayerDisabledEventName, this.onLensLayerDisabled);
        window.removeEventListener('minimap-show-highlight', this.showHighlightListener);
        window.removeEventListener('minimap-hide-highlight', this.hideHighlightListener);
        super.onDetach();
    }
    onContextChange(_event) {
        this.updateChatNavHelp();
    }
    onMinimapImageEngineInput(inputEvent) {
        if (inputEvent.detail.name == 'mousebutton-left' || inputEvent.detail.name == 'touch-tap' || inputEvent.detail.name == "touch-pan") {
            // Pressed sound
            if (inputEvent.detail.status == InputActionStatuses.START) {
                UI.sendAudioEvent(Audio.getSoundTag('data-audio-minimap-clicked-map', 'audio-panel-mini-map'));
            }
            // Dragged/Scrubbed sound
            if (inputEvent.detail.status == InputActionStatuses.DRAG) {
                UI.sendAudioEvent(Audio.getSoundTag('data-audio-minimap-scrubbed-map', 'audio-panel-mini-map'));
            }
            const quickPan = inputEvent.detail.status == InputActionStatuses.DRAG || inputEvent.detail.status == InputActionStatuses.UPDATE;
            this.updateMinimapCamera(quickPan);
            inputEvent.stopPropagation();
            inputEvent.preventDefault();
        }
    }
    onSocialPanelOpened() {
        // social panel is opening.  if the lens panel is open, close it now.
        if (this.lensPanelState) {
            this.toggleLensPanel();
        }
    }
    onCursorUpdated(event) {
        if (event.detail.target instanceof HTMLElement) {
            if (event.detail.target != this.mapLastCursor) {
                if (event.detail.target == this.mapImage) {
                    this.playSound("data-audio-minimap-focus");
                }
            }
            this.mapLastCursor = event.detail.target;
            this.lastCursorPos.x = event.detail.x;
            this.lastCursorPos.y = event.detail.y;
        }
    }
    onEngineInput(inputEvent) {
        if (inputEvent.detail.status != InputActionStatuses.FINISH) {
            return;
        }
        switch (inputEvent.detail.name) {
            case 'cancel':
            case 'sys-menu':
                if (this.chatPanelState) {
                    this.toggleChatPanel();
                }
                if (this.lensPanelState) {
                    this.toggleLensPanel();
                }
                inputEvent.stopPropagation();
                inputEvent.preventDefault();
                break;
        }
    }
    updateChatNavHelp() {
        this.chatPanel.classList.toggle("trigger-nav-help", this.chatPanelState && ContextManager.getCurrentTarget()?.tagName != "SEND-TO-PANEL" && ContextManager.getCurrentTarget()?.tagName != "EMOTICON-PANEL");
    }
    updateMinimapCamera(quickPan) {
        const minimapRect = this.mapImage?.getBoundingClientRect();
        if (minimapRect) {
            // Convert coordinates to UV space (0,0 to 1,1)
            const minimapU = (this.lastCursorPos.x - minimapRect.left) / minimapRect.width;
            const minimapV = 1 - ((this.lastCursorPos.y - minimapRect.top) / minimapRect.height);
            const worldPos = WorldUI.minimapToWorld({ x: minimapU, y: minimapV });
            if (worldPos && (this.lastMinimapPos.x != worldPos.x || this.lastMinimapPos.y != worldPos.y)) {
                if (quickPan) {
                    Camera.panFocus({ x: worldPos.x - this.lastMinimapPos.x, y: worldPos.y - this.lastMinimapPos.y });
                }
                else {
                    Camera.lookAt(worldPos.x, worldPos.y);
                }
                this.lastMinimapPos = worldPos;
            }
        }
    }
    updateRadialButton() {
        this.miniMapRadialButton.classList.toggle("hidden", !this.isScreenSmallMode() || !ActionHandler.isGamepadActive);
    }
    updateLensButton() {
        this.miniMapLensButton.classList.toggle("mx-3", this.isScreenSmallMode() && ActionHandler.isGamepadActive);
        this.miniMapLensButton.classList.toggle("mx-1", !this.isScreenSmallMode() || !ActionHandler.isGamepadActive);
    }
    updateRadialNavHelpContainer() {
        this.radialNavHelpContainer.classList.toggle("hidden", !this.isScreenSmallMode());
    }
    updateLensActionNavHelp() {
        this.toggleLensActionNavHelp.classList.toggle("right-12", this.isScreenSmallMode() && ActionHandler.isGamepadActive);
        this.toggleLensActionNavHelp.classList.toggle("right-22", !this.isScreenSmallMode() || !ActionHandler.isGamepadActive);
    }
    onResize() {
        this.updateRadialButton();
        this.updateLensButton();
        this.updateRadialNavHelpContainer();
        this.updateLensActionNavHelp();
    }
    onActiveDeviceTypeChanged() {
        this.updateRadialButton();
        this.updateLensButton();
        this.updateRadialNavHelpContainer();
        this.updateLensActionNavHelp();
    }
    createLensButton(caption, lens, group) {
        const isLensEnabled = LensManager.getActiveLens() === lens;
        const radioButtonLabelContainer = document.createElement("div");
        radioButtonLabelContainer.className = 'w-1\\/2 flex flex-row items-center';
        const radioButton = document.createElement("fxs-radio-button");
        this.lensElementMap[lens] = radioButton;
        radioButton.classList.add("mr-2");
        radioButton.setAttribute('disabled', (!this.lensPanelState).toString());
        radioButton.setAttribute("group-tag", group);
        radioButton.setAttribute('value', lens);
        radioButton.setAttribute("caption", caption);
        radioButton.setAttribute('selected', isLensEnabled.toString());
        radioButton.setAttribute('tabindex', '-1');
        radioButton.setAttribute("data-audio-group-ref", "audio-panel-mini-map");
        radioButton.setAttribute("data-audio-activate-ref", "data-audio-lens-toggle");
        radioButtonLabelContainer.appendChild(radioButton);
        this.lensRadioButtons.push(radioButton);
        const label = document.createElement("div");
        label.role = "paragraph";
        label.className = 'text-accent-2 text-base font-body pointer-events-auto';
        label.dataset.l10nId = caption;
        radioButtonLabelContainer.appendChild(label);
        this.lensRadioButtonContainer.appendChild(radioButtonLabelContainer);
        // Set selected if layer is already enabled
        radioButton.addEventListener('focusout', this.onFocusOut);
        radioButton.addEventListener(ComponentValueChangeEventName, this.onLensChange);
    }
    onActiveLensChanged() {
        for (const lensButton of this.lensRadioButtons) {
            const isLensEnabled = LensManager.getActiveLens() === lensButton.getAttribute("value");
            lensButton.setAttribute('selected', isLensEnabled.toString());
        }
    }
    createShowMinimapCheckbox() {
        const checkboxLabelContainer = document.createElement("div");
        checkboxLabelContainer.className = 'w-1\\/2 flex flex-row items-center';
        const checkbox = document.createElement("fxs-checkbox");
        checkbox.classList.add('mr-2');
        checkbox.setAttribute('selected', 'true');
        checkbox.setAttribute("data-audio-group-ref", "audio-panel-mini-map");
        checkboxLabelContainer.appendChild(checkbox);
        const label = document.createElement("div");
        label.role = "paragraph";
        label.className = 'text-accent-2 text-base font-body pointer-events-auto';
        label.dataset.l10nId = "LOC_UI_SHOW_MINIMAP";
        checkboxLabelContainer.appendChild(label);
        checkbox.addEventListener('focusout', this.onFocusOut);
        checkbox.addEventListener(ComponentValueChangeEventName, (event) => {
            this.miniMapTopContainer.classList.toggle("mini-map__main-minimized", !event.detail.value);
            if (event.detail.value) {
                Audio.playSound("data-audio-showing", "audio-panel-mini-map");
            }
            else {
                Audio.playSound("data-audio-hiding", "audio-panel-mini-map");
            }
        });
        return checkboxLabelContainer;
    }
    createLayerCheckbox(caption, layer) {
        const isLayerEnabled = LensManager.isLayerEnabled(layer);
        // Create and set up the checkbox
        const checkbox = document.createElement("fxs-checkbox");
        this.layerElementMap[layer] = checkbox;
        checkbox.classList.add('mr-2');
        checkbox.setAttribute('selected', isLayerEnabled.toString());
        checkbox.setAttribute("data-audio-group-ref", "audio-panel-mini-map");
        const checkboxLabelContainer = document.createElement("div");
        checkboxLabelContainer.className = 'w-1\\/2 flex flex-row items-center';
        checkboxLabelContainer.appendChild(checkbox);
        const label = document.createElement("div");
        label.role = "paragraph";
        label.className = 'text-accent-2 text-base font-body pointer-events-auto';
        label.dataset.l10nId = caption;
        checkboxLabelContainer.appendChild(label);
        this.layerCheckboxContainer.appendChild(checkboxLabelContainer);
        checkbox.addEventListener('focusout', this.onFocusOut);
        checkbox.addEventListener(ComponentValueChangeEventName, (event) => {
            const isLayerEnabled = LensManager.isLayerEnabled(layer);
            if (isLayerEnabled != event.detail.value) {
                LensManager.toggleLayer(layer, event.detail.value);
                MiniMapData.setDecorationOption(layer, event.detail.value);
            }
        });
    }
    isScreenSmallMode() {
        return window.innerHeight <= this.SMALL_SCREEN_MODE_MAX_HEIGHT || window.innerWidth <= this.SMALL_SCREEN_MODE_MAX_WIDTH;
    }
    /**
     * Create the button to toggle the lens panel
     * @returns the button element
     */
    createMinimapLensButton() {
        const miniMapButton = document.createElement("fxs-activatable");
        miniMapButton.classList.add("mini-map__lens-button", "mx-1");
        miniMapButton.setAttribute('data-tooltip-content', Locale.compose('LOC_UI_TOGGLE_LENS_PANEL'));
        miniMapButton.addEventListener('action-activate', () => {
            const toggle = this.toggleLensPanel();
            miniMapButton.classList.toggle('mini-map__button--selected', toggle);
        });
        const miniMapBG = document.createElement("div");
        miniMapBG.classList.add('mini-map__lens-button__bg', "pointer-events-none");
        miniMapButton.appendChild(miniMapBG);
        const miniMapButtonIcon = document.createElement("div");
        miniMapButtonIcon.classList.add("mini-map__lens-button__icon", "pointer-events-none");
        miniMapButton.appendChild(miniMapButtonIcon);
        return miniMapButton;
    }
    /**
     * Create the button to toggle the chat panel
     * @returns the button element
     */
    createMinimapChatButton() {
        const miniMapButton = document.createElement("fxs-activatable");
        miniMapButton.classList.add("mini-map__chat-button", "relative", "w-12", "h-12", "mx-1");
        Databind.classToggle(miniMapButton, "hidden", "g_NavTray.isTrayRequired");
        miniMapButton.setAttribute('data-tooltip-content', Locale.compose('LOC_UI_TOGGLE_CHAT_PANEL'));
        miniMapButton.addEventListener('action-activate', () => {
            const toggle = this.toggleChatPanel();
            miniMapButton.classList.toggle('mini-map__button--selected', toggle);
        });
        const miniMapBG = document.createElement("div");
        miniMapBG.classList.add('mini-map__chat-button__bg', "pointer-events-none");
        miniMapButton.appendChild(miniMapBG);
        const miniMapButtonIcon = document.createElement("div");
        miniMapButtonIcon.classList.add("mini-map__chat-button__icon", "pointer-events-none");
        miniMapButton.appendChild(miniMapButtonIcon);
        miniMapButton.setAttribute("data-audio-group-ref", "audio-panel-mini-map");
        miniMapButton.setAttribute("data-audio-activate-ref", "data-audio-minimap-panel-toggle");
        return miniMapButton;
    }
    /**
     * Create the button to open the radial menu
     * @returns the button element
     */
    createMinimapRadialButton() {
        const miniMapButton = document.createElement("div");
        miniMapButton.classList.add("mini-map__radial-button", "relative", "w-12", "h-12", "mx-3");
        const miniMapBG = document.createElement("div");
        miniMapBG.classList.add('mini-map__radial-button__bg', "pointer-events-none");
        miniMapButton.appendChild(miniMapBG);
        const miniMapButtonIcon = document.createElement("div");
        miniMapButtonIcon.classList.add("mini-map__radial-button__icon", "pointer-events-none");
        miniMapButton.appendChild(miniMapButtonIcon);
        miniMapButton.setAttribute("data-audio-group-ref", "audio-panel-mini-map");
        miniMapButton.setAttribute("data-audio-activate-ref", "data-audio-minimap-panel-toggle");
        return miniMapButton;
    }
    onShowHighlight(event) {
        if (!this.mapHighlight) {
            console.warn("PanelMiniMap: received a minimap-show-highlight event but the mapHighLight element is not set. Is the minimap attached yet?");
            return;
        }
        const x = parseInt(event.detail.x);
        const y = parseInt(event.detail.y);
        const oddLineOffset = y % 2 ? 0.5 : 0;
        const inverseY = this.mapHeight - 1 - y;
        // add 0.5 so the highlight is centered in the minimap plot
        const coordPercentX = (x + oddLineOffset + 0.5) / (this.mapWidth + 0.5) * 100;
        const coordPercentY = (inverseY + this.mapTopBorderTiles + 0.5) / (this.mapHeight + this.mapTopBorderTiles + this.mapBottomBorderTiles + 0.5) * 100;
        this.mapHighlight.style.transform = `translate(${coordPercentX}%, ${coordPercentY}%)`;
        // wait a bit so the animation can reset when going between two elements that request the highlight
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                if (this.mapHighlight) {
                    this.mapHighlight.classList.add('displayed');
                }
            });
        });
    }
    onHideHighlight() {
        if (this.mapHighlight) {
            this.mapHighlight.classList.remove('displayed');
        }
        else {
            console.warn("PanelMiniMap: received a minimap-hide-highlight event but the mapHighLight element is not set. Is the minimap attached yet?");
        }
    }
}
Controls.define('panel-mini-map', {
    createInstance: PanelMiniMap,
    description: 'Minimap and lens/pennant display.',
    classNames: ['mini-map'],
    styles: ["fs://game/base-standard/ui/mini-map/panel-mini-map.css"],
    images: [
        'fs://game/hud_mini_box.png',
        'fs://game/action_lookout.png',
        'fs://game/hud_mini_lens_btn.png'
    ]
});

//# sourceMappingURL=file:///base-standard/ui/mini-map/panel-mini-map.js.map
