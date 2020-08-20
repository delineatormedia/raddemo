var radDemo = (function () {
  'use strict';

  class KeyCombo {
    constructor(keyComboStr) {
      this.sourceStr = keyComboStr;
      this.subCombos = KeyCombo.parseComboStr(keyComboStr);
      this.keyNames  = this.subCombos.reduce((memo, nextSubCombo) =>
        memo.concat(nextSubCombo), []);
    }

    check(pressedKeyNames) {
      let startingKeyNameIndex = 0;
      for (let i = 0; i < this.subCombos.length; i += 1) {
        startingKeyNameIndex = this._checkSubCombo(
          this.subCombos[i],
          startingKeyNameIndex,
          pressedKeyNames
        );
        if (startingKeyNameIndex === -1) { return false; }
      }
      return true;
    };

    isEqual(otherKeyCombo) {
      if (
        !otherKeyCombo ||
        typeof otherKeyCombo !== 'string' &&
        typeof otherKeyCombo !== 'object'
      ) { return false; }

      if (typeof otherKeyCombo === 'string') {
        otherKeyCombo = new KeyCombo(otherKeyCombo);
      }

      if (this.subCombos.length !== otherKeyCombo.subCombos.length) {
        return false;
      }
      for (let i = 0; i < this.subCombos.length; i += 1) {
        if (this.subCombos[i].length !== otherKeyCombo.subCombos[i].length) {
          return false;
        }
      }

      for (let i = 0; i < this.subCombos.length; i += 1) {
        const subCombo      = this.subCombos[i];
        const otherSubCombo = otherKeyCombo.subCombos[i].slice(0);

        for (let j = 0; j < subCombo.length; j += 1) {
          const keyName = subCombo[j];
          const index   = otherSubCombo.indexOf(keyName);

          if (index > -1) {
            otherSubCombo.splice(index, 1);
          }
        }
        if (otherSubCombo.length !== 0) {
          return false;
        }
      }

      return true;
    };

    _checkSubCombo(subCombo, startingKeyNameIndex, pressedKeyNames) {
      subCombo = subCombo.slice(0);
      pressedKeyNames = pressedKeyNames.slice(startingKeyNameIndex);

      let endIndex = startingKeyNameIndex;
      for (let i = 0; i < subCombo.length; i += 1) {

        let keyName = subCombo[i];
        if (keyName[0] === '\\') {
          const escapedKeyName = keyName.slice(1);
          if (
            escapedKeyName === KeyCombo.comboDeliminator ||
            escapedKeyName === KeyCombo.keyDeliminator
          ) {
            keyName = escapedKeyName;
          }
        }

        const index = pressedKeyNames.indexOf(keyName);
        if (index > -1) {
          subCombo.splice(i, 1);
          i -= 1;
          if (index > endIndex) {
            endIndex = index;
          }
          if (subCombo.length === 0) {
            return endIndex;
          }
        }
      }
      return -1;
    };
  }

  KeyCombo.comboDeliminator = '>';
  KeyCombo.keyDeliminator   = '+';

  KeyCombo.parseComboStr = function(keyComboStr) {
    const subComboStrs = KeyCombo._splitStr(keyComboStr, KeyCombo.comboDeliminator);
    const combo        = [];

    for (let i = 0 ; i < subComboStrs.length; i += 1) {
      combo.push(KeyCombo._splitStr(subComboStrs[i], KeyCombo.keyDeliminator));
    }
    return combo;
  };

  KeyCombo._splitStr = function(str, deliminator) {
    const s  = str;
    const d  = deliminator;
    let c  = '';
    const ca = [];

    for (let ci = 0; ci < s.length; ci += 1) {
      if (ci > 0 && s[ci] === d && s[ci - 1] !== '\\') {
        ca.push(c.trim());
        c = '';
        ci += 1;
      }
      c += s[ci];
    }
    if (c) { ca.push(c.trim()); }

    return ca;
  };

  class Locale {
    constructor(name) {
      this.localeName          = name;
      this.activeTargetKeys = [];
      this.pressedKeys         = [];
      this._appliedMacros      = [];
      this._keyMap             = {};
      this._killKeyCodes       = [];
      this._macros             = [];
    }

    bindKeyCode(keyCode, keyNames) {
      if (typeof keyNames === 'string') {
        keyNames = [keyNames];
      }

      this._keyMap[keyCode] = keyNames;
    };

    bindMacro(keyComboStr, keyNames) {
      if (typeof keyNames === 'string') {
        keyNames = [ keyNames ];
      }

      let handler = null;
      if (typeof keyNames === 'function') {
        handler = keyNames;
        keyNames = null;
      }

      const macro = {
        keyCombo : new KeyCombo(keyComboStr),
        keyNames : keyNames,
        handler  : handler
      };

      this._macros.push(macro);
    };

    getKeyCodes(keyName) {
      const keyCodes = [];
      for (const keyCode in this._keyMap) {
        const index = this._keyMap[keyCode].indexOf(keyName);
        if (index > -1) { keyCodes.push(keyCode|0); }
      }
      return keyCodes;
    };

    getKeyNames(keyCode) {
      return this._keyMap[keyCode] || [];
    };

    setKillKey(keyCode) {
      if (typeof keyCode === 'string') {
        const keyCodes = this.getKeyCodes(keyCode);
        for (let i = 0; i < keyCodes.length; i += 1) {
          this.setKillKey(keyCodes[i]);
        }
        return;
      }

      this._killKeyCodes.push(keyCode);
    };

    pressKey(keyCode) {
      if (typeof keyCode === 'string') {
        const keyCodes = this.getKeyCodes(keyCode);
        for (let i = 0; i < keyCodes.length; i += 1) {
          this.pressKey(keyCodes[i]);
        }
        return;
      }

      this.activeTargetKeys.length = 0;
      const keyNames = this.getKeyNames(keyCode);
      for (let i = 0; i < keyNames.length; i += 1) {
        this.activeTargetKeys.push(keyNames[i]);
        if (this.pressedKeys.indexOf(keyNames[i]) === -1) {
          this.pressedKeys.push(keyNames[i]);
        }
      }

      this._applyMacros();
    };

    releaseKey(keyCode) {
      if (typeof keyCode === 'string') {
        const keyCodes = this.getKeyCodes(keyCode);
        for (let i = 0; i < keyCodes.length; i += 1) {
          this.releaseKey(keyCodes[i]);
        }

      } else {
        const keyNames         = this.getKeyNames(keyCode);
        const killKeyCodeIndex = this._killKeyCodes.indexOf(keyCode);

        if (killKeyCodeIndex !== -1) {
          this.pressedKeys.length = 0;
        } else {
          for (let i = 0; i < keyNames.length; i += 1) {
            const index = this.pressedKeys.indexOf(keyNames[i]);
            if (index > -1) {
              this.pressedKeys.splice(index, 1);
            }
          }
        }

        this.activeTargetKeys.length = 0;
        this._clearMacros();
      }
    };

    _applyMacros() {
      const macros = this._macros.slice(0);
      for (let i = 0; i < macros.length; i += 1) {
        const macro = macros[i];
        if (macro.keyCombo.check(this.pressedKeys)) {
          if (macro.handler) {
            macro.keyNames = macro.handler(this.pressedKeys);
          }
          for (let j = 0; j < macro.keyNames.length; j += 1) {
            if (this.pressedKeys.indexOf(macro.keyNames[j]) === -1) {
              this.pressedKeys.push(macro.keyNames[j]);
            }
          }
          this._appliedMacros.push(macro);
        }
      }
    };

    _clearMacros() {
      for (let i = 0; i < this._appliedMacros.length; i += 1) {
        const macro = this._appliedMacros[i];
        if (!macro.keyCombo.check(this.pressedKeys)) {
          for (let j = 0; j < macro.keyNames.length; j += 1) {
            const index = this.pressedKeys.indexOf(macro.keyNames[j]);
            if (index > -1) {
              this.pressedKeys.splice(index, 1);
            }
          }
          if (macro.handler) {
            macro.keyNames = null;
          }
          this._appliedMacros.splice(i, 1);
          i -= 1;
        }
      }
    }
  }

  class Keyboard {
    constructor(targetWindow, targetElement, targetPlatform, targetUserAgent) {
      this._locale               = null;
      this._currentContext       = '';
      this._contexts             = {};
      this._listeners            = [];
      this._appliedListeners     = [];
      this._locales              = {};
      this._targetElement        = null;
      this._targetWindow         = null;
      this._targetPlatform       = '';
      this._targetUserAgent      = '';
      this._isModernBrowser      = false;
      this._targetKeyDownBinding = null;
      this._targetKeyUpBinding   = null;
      this._targetResetBinding   = null;
      this._paused               = false;

      this._contexts.global = {
        listeners: this._listeners,
        targetWindow,
        targetElement,
        targetPlatform,
        targetUserAgent
      };

      this.setContext('global');
    }

    setLocale(localeName, localeBuilder) {
      let locale = null;
      if (typeof localeName === 'string') {

        if (localeBuilder) {
          locale = new Locale(localeName);
          localeBuilder(locale, this._targetPlatform, this._targetUserAgent);
        } else {
          locale = this._locales[localeName] || null;
        }
      } else {
        locale     = localeName;
        localeName = locale._localeName;
      }

      this._locale              = locale;
      this._locales[localeName] = locale;
      if (locale) {
        this._locale.pressedKeys = locale.pressedKeys;
      }

      return this;
    }

    getLocale(localName) {
      localName || (localName = this._locale.localeName);
      return this._locales[localName] || null;
    }

    bind(keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault) {
      if (keyComboStr === null || typeof keyComboStr === 'function') {
        preventRepeatByDefault = releaseHandler;
        releaseHandler         = pressHandler;
        pressHandler           = keyComboStr;
        keyComboStr            = null;
      }

      if (
        keyComboStr &&
        typeof keyComboStr === 'object' &&
        typeof keyComboStr.length === 'number'
      ) {
        for (let i = 0; i < keyComboStr.length; i += 1) {
          this.bind(keyComboStr[i], pressHandler, releaseHandler);
        }
        return this;
      }

      this._listeners.push({
        keyCombo              : keyComboStr ? new KeyCombo(keyComboStr) : null,
        pressHandler          : pressHandler           || null,
        releaseHandler        : releaseHandler         || null,
        preventRepeat         : preventRepeatByDefault || false,
        preventRepeatByDefault: preventRepeatByDefault || false,
        executingHandler      : false
      });

      return this;
    }

    addListener(keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault) {
      return this.bind(keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault);
    }

    on(keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault) {
      return this.bind(keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault);
    }

    bindPress(keyComboStr, pressHandler, preventRepeatByDefault) {
      return this.bind(keyComboStr, pressHandler, null, preventRepeatByDefault);
    }

    bindRelease(keyComboStr, releaseHandler) {
      return this.bind(keyComboStr, null, releaseHandler, preventRepeatByDefault);
    }

    unbind(keyComboStr, pressHandler, releaseHandler) {
      if (keyComboStr === null || typeof keyComboStr === 'function') {
        releaseHandler = pressHandler;
        pressHandler   = keyComboStr;
        keyComboStr = null;
      }

      if (
        keyComboStr &&
        typeof keyComboStr === 'object' &&
        typeof keyComboStr.length === 'number'
      ) {
        for (let i = 0; i < keyComboStr.length; i += 1) {
          this.unbind(keyComboStr[i], pressHandler, releaseHandler);
        }
        return this;
      }

      for (let i = 0; i < this._listeners.length; i += 1) {
        const listener = this._listeners[i];

        const comboMatches          = !keyComboStr && !listener.keyCombo ||
                                    listener.keyCombo && listener.keyCombo.isEqual(keyComboStr);
        const pressHandlerMatches   = !pressHandler && !releaseHandler ||
                                    !pressHandler && !listener.pressHandler ||
                                    pressHandler === listener.pressHandler;
        const releaseHandlerMatches = !pressHandler && !releaseHandler ||
                                    !releaseHandler && !listener.releaseHandler ||
                                    releaseHandler === listener.releaseHandler;

        if (comboMatches && pressHandlerMatches && releaseHandlerMatches) {
          this._listeners.splice(i, 1);
          i -= 1;
        }
      }

      return this;
    }

    removeListener(keyComboStr, pressHandler, releaseHandler) {
      return this.unbind(keyComboStr, pressHandler, releaseHandler);
    }

    off(keyComboStr, pressHandler, releaseHandler) {
      return this.unbind(keyComboStr, pressHandler, releaseHandler);
    }

    setContext(contextName) {
      if(this._locale) { this.releaseAllKeys(); }

      if (!this._contexts[contextName]) {
        const globalContext = this._contexts.global;
        this._contexts[contextName] = {
          listeners      : [],
          targetWindow   : globalContext.targetWindow,
          targetElement  : globalContext.targetElement,
          targetPlatform : globalContext.targetPlatform,
          targetUserAgent: globalContext.targetUserAgent
        };
      }

      const context        = this._contexts[contextName];
      this._currentContext = contextName;
      this._listeners      = context.listeners;

      this.stop();
      this.watch(
        context.targetWindow,
        context.targetElement,
        context.targetPlatform,
        context.targetUserAgent
      );

      return this;
    }

    getContext() {
      return this._currentContext;
    }

    withContext(contextName, callback) {
      const previousContextName = this.getContext();
      this.setContext(contextName);

      callback();

      this.setContext(previousContextName);

      return this;
    }

    watch(targetWindow, targetElement, targetPlatform, targetUserAgent) {
      this.stop();

      const win = typeof globalThis !== 'undefined' ? globalThis :
                  typeof global !== 'undefined' ? global :
                  typeof window !== 'undefined' ? window :
                  {};

      if (!targetWindow) {
        if (!win.addEventListener && !win.attachEvent) {
          throw new Error('Cannot find window functions addEventListener or attachEvent.');
        }
        targetWindow = win;
      }

      // Handle element bindings where a target window is not passed
      if (typeof targetWindow.nodeType === 'number') {
        targetUserAgent = targetPlatform;
        targetPlatform  = targetElement;
        targetElement   = targetWindow;
        targetWindow    = win;
      }

      if (!targetWindow.addEventListener && !targetWindow.attachEvent) {
        throw new Error('Cannot find addEventListener or attachEvent methods on targetWindow.');
      }

      this._isModernBrowser = !!targetWindow.addEventListener;

      const userAgent = targetWindow.navigator && targetWindow.navigator.userAgent || '';
      const platform  = targetWindow.navigator && targetWindow.navigator.platform  || '';

      targetElement   && targetElement   !== null || (targetElement   = targetWindow.document);
      targetPlatform  && targetPlatform  !== null || (targetPlatform  = platform);
      targetUserAgent && targetUserAgent !== null || (targetUserAgent = userAgent);

      this._targetKeyDownBinding = (event) => {
        this.pressKey(event.keyCode, event);
        this._handleCommandBug(event, platform);
      };
      this._targetKeyUpBinding = (event) => {
        this.releaseKey(event.keyCode, event);
      };
      this._targetResetBinding = (event) => {
        this.releaseAllKeys(event);
      };

      this._bindEvent(targetElement, 'keydown', this._targetKeyDownBinding);
      this._bindEvent(targetElement, 'keyup',   this._targetKeyUpBinding);
      this._bindEvent(targetWindow,  'focus',   this._targetResetBinding);
      this._bindEvent(targetWindow,  'blur',    this._targetResetBinding);

      this._targetElement   = targetElement;
      this._targetWindow    = targetWindow;
      this._targetPlatform  = targetPlatform;
      this._targetUserAgent = targetUserAgent;

      const currentContext           = this._contexts[this._currentContext];
      currentContext.targetWindow    = this._targetWindow;
      currentContext.targetElement   = this._targetElement;
      currentContext.targetPlatform  = this._targetPlatform;
      currentContext.targetUserAgent = this._targetUserAgent;

      return this;
    }

    stop() {
      if (!this._targetElement || !this._targetWindow) { return; }

      this._unbindEvent(this._targetElement, 'keydown', this._targetKeyDownBinding);
      this._unbindEvent(this._targetElement, 'keyup',   this._targetKeyUpBinding);
      this._unbindEvent(this._targetWindow,  'focus',   this._targetResetBinding);
      this._unbindEvent(this._targetWindow,  'blur',    this._targetResetBinding);

      this._targetWindow  = null;
      this._targetElement = null;

      return this;
    }

    pressKey(keyCode, event) {
      if (this._paused) { return this; }
      if (!this._locale) { throw new Error('Locale not set'); }

      this._locale.pressKey(keyCode);
      this._applyBindings(event);

      return this;
    }

    releaseKey(keyCode, event) {
      if (this._paused) { return this; }
      if (!this._locale) { throw new Error('Locale not set'); }

      this._locale.releaseKey(keyCode);
      this._clearBindings(event);

      return this;
    }

    releaseAllKeys(event) {
      if (this._paused) { return this; }
      if (!this._locale) { throw new Error('Locale not set'); }

      this._locale.pressedKeys.length = 0;
      this._clearBindings(event);

      return this;
    }

    pause() {
      if (this._paused) { return this; }
      if (this._locale) { this.releaseAllKeys(); }
      this._paused = true;

      return this;
    }

    resume() {
      this._paused = false;

      return this;
    }

    reset() {
      this.releaseAllKeys();
      this._listeners.length = 0;

      return this;
    }

    _bindEvent(targetElement, eventName, handler) {
      return this._isModernBrowser ?
        targetElement.addEventListener(eventName, handler, false) :
        targetElement.attachEvent('on' + eventName, handler);
    }

    _unbindEvent(targetElement, eventName, handler) {
      return this._isModernBrowser ?
        targetElement.removeEventListener(eventName, handler, false) :
        targetElement.detachEvent('on' + eventName, handler);
    }

    _getGroupedListeners() {
      const listenerGroups   = [];
      const listenerGroupMap = [];

      let listeners = this._listeners;
      if (this._currentContext !== 'global') {
        listeners = [...listeners, ...this._contexts.global.listeners];
      }

      listeners.sort(
        (a, b) =>
          (b.keyCombo ? b.keyCombo.keyNames.length : 0) -
          (a.keyCombo ? a.keyCombo.keyNames.length : 0)
      ).forEach((l) => {
        let mapIndex = -1;
        for (let i = 0; i < listenerGroupMap.length; i += 1) {
          if (listenerGroupMap[i] === null && l.keyCombo === null ||
              listenerGroupMap[i] !== null && listenerGroupMap[i].isEqual(l.keyCombo)) {
            mapIndex = i;
          }
        }
        if (mapIndex === -1) {
          mapIndex = listenerGroupMap.length;
          listenerGroupMap.push(l.keyCombo);
        }
        if (!listenerGroups[mapIndex]) {
          listenerGroups[mapIndex] = [];
        }
        listenerGroups[mapIndex].push(l);
      });

      return listenerGroups;
    }

    _applyBindings(event) {
      let preventRepeat = false;

      event || (event = {});
      event.preventRepeat = () => { preventRepeat = true; };
      event.pressedKeys   = this._locale.pressedKeys.slice(0);

      const activeTargetKeys = this._locale.activeTargetKeys;
      const pressedKeys      = this._locale.pressedKeys.slice(0);
      const listenerGroups   = this._getGroupedListeners();

      for (let i = 0; i < listenerGroups.length; i += 1) {
        const listeners = listenerGroups[i];
        const keyCombo  = listeners[0].keyCombo;

        if (
          keyCombo === null ||
          keyCombo.check(pressedKeys) &&
          activeTargetKeys.some(k => keyCombo.keyNames.includes(k))
        ) {
          for (let j = 0; j < listeners.length; j += 1) {
            let listener = listeners[j];

            if (!listener.executingHandler && listener.pressHandler && !listener.preventRepeat) {
              listener.executingHandler = true;
              listener.pressHandler.call(this, event);
              listener.executingHandler = false;

              if (preventRepeat || listener.preventRepeatByDefault) {
                listener.preventRepeat = true;
                preventRepeat          = false;
              }
            }

            if (this._appliedListeners.indexOf(listener) === -1) {
              this._appliedListeners.push(listener);
            }
          }

          if (keyCombo) {
            for (let j = 0; j < keyCombo.keyNames.length; j += 1) {
              const index = pressedKeys.indexOf(keyCombo.keyNames[j]);
              if (index !== -1) {
                pressedKeys.splice(index, 1);
                j -= 1;
              }
            }
          }
        }
      }
    }

    _clearBindings(event) {
      event || (event = {});
      event.pressedKeys = this._locale.pressedKeys.slice(0);

      for (let i = 0; i < this._appliedListeners.length; i += 1) {
        const listener = this._appliedListeners[i];
        const keyCombo = listener.keyCombo;
        if (keyCombo === null || !keyCombo.check(this._locale.pressedKeys)) {
          listener.preventRepeat = false;
          if (keyCombo !== null || event.pressedKeys.length === 0) {
            this._appliedListeners.splice(i, 1);
            i -= 1;
          }
          if (!listener.executingHandler && listener.releaseHandler) {
            listener.executingHandler = true;
            listener.releaseHandler.call(this, event);
            listener.executingHandler = false;
          }
        }
      }
    }

    _handleCommandBug(event, platform) {
      // On Mac when the command key is kept pressed, keyup is not triggered for any other key.
      // In this case force a keyup for non-modifier keys directly after the keypress.
      const modifierKeys = ["shift", "ctrl", "alt", "capslock", "tab", "command"];
      if (platform.match("Mac") && this._locale.pressedKeys.includes("command") &&
          !modifierKeys.includes(this._locale.getKeyNames(event.keyCode)[0])) {
        this._targetKeyUpBinding(event);
      }
    }
  }

  function us(locale, platform, userAgent) {

    // general
    locale.bindKeyCode(3,   ['cancel']);
    locale.bindKeyCode(8,   ['backspace']);
    locale.bindKeyCode(9,   ['tab']);
    locale.bindKeyCode(12,  ['clear']);
    locale.bindKeyCode(13,  ['enter']);
    locale.bindKeyCode(16,  ['shift']);
    locale.bindKeyCode(17,  ['ctrl']);
    locale.bindKeyCode(18,  ['alt', 'menu']);
    locale.bindKeyCode(19,  ['pause', 'break']);
    locale.bindKeyCode(20,  ['capslock']);
    locale.bindKeyCode(27,  ['escape', 'esc']);
    locale.bindKeyCode(32,  ['space', 'spacebar']);
    locale.bindKeyCode(33,  ['pageup']);
    locale.bindKeyCode(34,  ['pagedown']);
    locale.bindKeyCode(35,  ['end']);
    locale.bindKeyCode(36,  ['home']);
    locale.bindKeyCode(37,  ['left']);
    locale.bindKeyCode(38,  ['up']);
    locale.bindKeyCode(39,  ['right']);
    locale.bindKeyCode(40,  ['down']);
    locale.bindKeyCode(41,  ['select']);
    locale.bindKeyCode(42,  ['printscreen']);
    locale.bindKeyCode(43,  ['execute']);
    locale.bindKeyCode(44,  ['snapshot']);
    locale.bindKeyCode(45,  ['insert', 'ins']);
    locale.bindKeyCode(46,  ['delete', 'del']);
    locale.bindKeyCode(47,  ['help']);
    locale.bindKeyCode(145, ['scrolllock', 'scroll']);
    locale.bindKeyCode(188, ['comma', ',']);
    locale.bindKeyCode(190, ['period', '.']);
    locale.bindKeyCode(191, ['slash', 'forwardslash', '/']);
    locale.bindKeyCode(192, ['graveaccent', '`']);
    locale.bindKeyCode(219, ['openbracket', '[']);
    locale.bindKeyCode(220, ['backslash', '\\']);
    locale.bindKeyCode(221, ['closebracket', ']']);
    locale.bindKeyCode(222, ['apostrophe', '\'']);

    // 0-9
    locale.bindKeyCode(48, ['zero', '0']);
    locale.bindKeyCode(49, ['one', '1']);
    locale.bindKeyCode(50, ['two', '2']);
    locale.bindKeyCode(51, ['three', '3']);
    locale.bindKeyCode(52, ['four', '4']);
    locale.bindKeyCode(53, ['five', '5']);
    locale.bindKeyCode(54, ['six', '6']);
    locale.bindKeyCode(55, ['seven', '7']);
    locale.bindKeyCode(56, ['eight', '8']);
    locale.bindKeyCode(57, ['nine', '9']);

    // numpad
    locale.bindKeyCode(96, ['numzero', 'num0']);
    locale.bindKeyCode(97, ['numone', 'num1']);
    locale.bindKeyCode(98, ['numtwo', 'num2']);
    locale.bindKeyCode(99, ['numthree', 'num3']);
    locale.bindKeyCode(100, ['numfour', 'num4']);
    locale.bindKeyCode(101, ['numfive', 'num5']);
    locale.bindKeyCode(102, ['numsix', 'num6']);
    locale.bindKeyCode(103, ['numseven', 'num7']);
    locale.bindKeyCode(104, ['numeight', 'num8']);
    locale.bindKeyCode(105, ['numnine', 'num9']);
    locale.bindKeyCode(106, ['nummultiply', 'num*']);
    locale.bindKeyCode(107, ['numadd', 'num+']);
    locale.bindKeyCode(108, ['numenter']);
    locale.bindKeyCode(109, ['numsubtract', 'num-']);
    locale.bindKeyCode(110, ['numdecimal', 'num.']);
    locale.bindKeyCode(111, ['numdivide', 'num/']);
    locale.bindKeyCode(144, ['numlock', 'num']);

    // function keys
    locale.bindKeyCode(112, ['f1']);
    locale.bindKeyCode(113, ['f2']);
    locale.bindKeyCode(114, ['f3']);
    locale.bindKeyCode(115, ['f4']);
    locale.bindKeyCode(116, ['f5']);
    locale.bindKeyCode(117, ['f6']);
    locale.bindKeyCode(118, ['f7']);
    locale.bindKeyCode(119, ['f8']);
    locale.bindKeyCode(120, ['f9']);
    locale.bindKeyCode(121, ['f10']);
    locale.bindKeyCode(122, ['f11']);
    locale.bindKeyCode(123, ['f12']);
    locale.bindKeyCode(124, ['f13']);
    locale.bindKeyCode(125, ['f14']);
    locale.bindKeyCode(126, ['f15']);
    locale.bindKeyCode(127, ['f16']);
    locale.bindKeyCode(128, ['f17']);
    locale.bindKeyCode(129, ['f18']);
    locale.bindKeyCode(130, ['f19']);
    locale.bindKeyCode(131, ['f20']);
    locale.bindKeyCode(132, ['f21']);
    locale.bindKeyCode(133, ['f22']);
    locale.bindKeyCode(134, ['f23']);
    locale.bindKeyCode(135, ['f24']);

    // secondary key symbols
    locale.bindMacro('shift + `', ['tilde', '~']);
    locale.bindMacro('shift + 1', ['exclamation', 'exclamationpoint', '!']);
    locale.bindMacro('shift + 2', ['at', '@']);
    locale.bindMacro('shift + 3', ['number', '#']);
    locale.bindMacro('shift + 4', ['dollar', 'dollars', 'dollarsign', '$']);
    locale.bindMacro('shift + 5', ['percent', '%']);
    locale.bindMacro('shift + 6', ['caret', '^']);
    locale.bindMacro('shift + 7', ['ampersand', 'and', '&']);
    locale.bindMacro('shift + 8', ['asterisk', '*']);
    locale.bindMacro('shift + 9', ['openparen', '(']);
    locale.bindMacro('shift + 0', ['closeparen', ')']);
    locale.bindMacro('shift + -', ['underscore', '_']);
    locale.bindMacro('shift + =', ['plus', '+']);
    locale.bindMacro('shift + [', ['opencurlybrace', 'opencurlybracket', '{']);
    locale.bindMacro('shift + ]', ['closecurlybrace', 'closecurlybracket', '}']);
    locale.bindMacro('shift + \\', ['verticalbar', '|']);
    locale.bindMacro('shift + ;', ['colon', ':']);
    locale.bindMacro('shift + \'', ['quotationmark', '\'']);
    locale.bindMacro('shift + !,', ['openanglebracket', '<']);
    locale.bindMacro('shift + .', ['closeanglebracket', '>']);
    locale.bindMacro('shift + /', ['questionmark', '?']);

    if (platform.match('Mac')) {
      locale.bindMacro('command', ['mod', 'modifier']);
    } else {
      locale.bindMacro('ctrl', ['mod', 'modifier']);
    }

    //a-z and A-Z
    for (let keyCode = 65; keyCode <= 90; keyCode += 1) {
      var keyName = String.fromCharCode(keyCode + 32);
      var capitalKeyName = String.fromCharCode(keyCode);
    	locale.bindKeyCode(keyCode, keyName);
    	locale.bindMacro('shift + ' + keyName, capitalKeyName);
    	locale.bindMacro('capslock + ' + keyName, capitalKeyName);
    }

    // browser caveats
    const semicolonKeyCode = userAgent.match('Firefox') ? 59  : 186;
    const dashKeyCode      = userAgent.match('Firefox') ? 173 : 189;
    const equalKeyCode     = userAgent.match('Firefox') ? 61  : 187;
    let leftCommandKeyCode;
    let rightCommandKeyCode;
    if (platform.match('Mac') && (userAgent.match('Safari') || userAgent.match('Chrome'))) {
      leftCommandKeyCode  = 91;
      rightCommandKeyCode = 93;
    } else if(platform.match('Mac') && userAgent.match('Opera')) {
      leftCommandKeyCode  = 17;
      rightCommandKeyCode = 17;
    } else if(platform.match('Mac') && userAgent.match('Firefox')) {
      leftCommandKeyCode  = 224;
      rightCommandKeyCode = 224;
    }
    locale.bindKeyCode(semicolonKeyCode,    ['semicolon', ';']);
    locale.bindKeyCode(dashKeyCode,         ['dash', '-']);
    locale.bindKeyCode(equalKeyCode,        ['equal', 'equalsign', '=']);
    locale.bindKeyCode(leftCommandKeyCode,  ['command', 'windows', 'win', 'super', 'leftcommand', 'leftwindows', 'leftwin', 'leftsuper']);
    locale.bindKeyCode(rightCommandKeyCode, ['command', 'windows', 'win', 'super', 'rightcommand', 'rightwindows', 'rightwin', 'rightsuper']);

    // kill keys
    locale.setKillKey('command');
  }

  const keyboard = new Keyboard();

  keyboard.setLocale('us', us);

  keyboard.Keyboard = Keyboard;
  keyboard.Locale = Locale;
  keyboard.KeyCombo = KeyCombo;

  const videoTag = `
    <div class="raddemo video-container">
        <video width="1280" height="720" muted></video>
    </div>
`;

  const videoControls = `
    <div class="video-controls">
        <div class="timeline-container">
            <div class="timeline-fill"></div>
            <div class="timeline-pause-points-container"></div>
        </div>
        <div class="buttons">
            <button type="button" class="playlist-prev">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M11.5 280.6l192 160c20.6 17.2 52.5 2.8 52.5-24.6V96c0-27.4-31.9-41.8-52.5-24.6l-192 160c-15.3 12.8-15.3 36.4 0 49.2zm256 0l192 160c20.6 17.2 52.5 2.8 52.5-24.6V96c0-27.4-31.9-41.8-52.5-24.6l-192 160c-15.3 12.8-15.3 36.4 0 49.2z"/></svg>
                <span class="sr-only">Prev Chapter</span>
            </button>
            <button type="button" class="prev">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M64 468V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12v176.4l195.5-181C352.1 22.3 384 36.6 384 64v384c0 27.4-31.9 41.7-52.5 24.6L136 292.7V468c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12z"/></svg>
                <span class="sr-only">Previous</span>
            </button>
            <button type="button" class="play-pause pause">
                <span class="play">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"/></svg>
                </span>
                <span class="pause">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"/></svg>
                </span>
                <span class="sr-only">Play / Pause</span>
            </button>
            <button type="button" class="next">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M384 44v424c0 6.6-5.4 12-12 12h-48c-6.6 0-12-5.4-12-12V291.6l-195.5 181C95.9 489.7 64 475.4 64 448V64c0-27.4 31.9-41.7 52.5-24.6L312 219.3V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12z"/></svg>
                <span class="sr-only">Next</span>
            </button>
            <button type="button" class="playlist-next">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M500.5 231.4l-192-160C287.9 54.3 256 68.6 256 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2zm-256 0l-192-160C31.9 54.3 0 68.6 0 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2z"/></svg>
                <span class="sr-only">Next Chapter</span>
            </button>
            <button type="button" class="settings" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"/></svg>
                <span class="sr-only">Settings</span>
            </button>
        </div>
        <div class="timecode"></div>
    </div> 
`;

  const settingsUI = `
    <div class="settings-overlay"></div>
    
    <div class="settings-panel">
        <h2><i class="fas fa-cog"></i> Settings</h2>
        
        <div>
            <h3>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M384 44v424c0 6.6-5.4 12-12 12h-48c-6.6 0-12-5.4-12-12V291.6l-195.5 181C95.9 489.7 64 475.4 64 448V64c0-27.4 31.9-41.7 52.5-24.6L312 219.3V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12z"/></svg>
                Next Button Behavior
            </h3>
            <label>Autoplay the next pause point?</label>
            <input type="checkbox" name="autoplay-next-pause-point" class="autoplay-next-pause-point" checked />
        </div>
        
        <div>
            <h3>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M500.5 231.4l-192-160C287.9 54.3 256 68.6 256 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2zm-256 0l-192-160C31.9 54.3 0 68.6 0 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2z"/></svg>
                Next Chapter Button Behavior
            </h3>
            <label>Autoplay the next chapter?</label>
            <input type="checkbox" name="autoplay-next-chapter" class="autoplay-next-chapter" checked />
        </div>
        
        <div>
            <button type="button" class="settings-confirm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"/></svg>
                OK
            </button>
        </div>
    </div>
`;

  class RadDemo {
      /**
       * Constructs the instance of RadDemo.
       * @param {object} props
       */
      constructor(props) {

          this.state = {
              currentPlaylistItem: 0,
              interval: props.interval ? props.interval : 100,
              subinterval: props.interval ? props.interval/2 : 100/2,
              timecodeCurrent: 0,
              timecodePrev: 0,
              pausePointPrev: 0,
              pausePointCurrent: 0,
              autoplayNextPausePoint: sessionStorage.autoPlayNextPausePoint ? sessionStorage.autoPlayNextPausePoint === 'true' : typeof props.autoplayNextPausePoint === 'boolean' ? props.autoplayNextPausePoint : true,
              autoplayPrevPausePoint: props.autoplayPrevPausePoint,
              autoplayNextChapter: sessionStorage.autoPlayNextChapter ? sessionStorage.autoPlayNextChapter === 'true' : typeof props.autoplayNextChapter === 'boolean' ? props.autoplayNextChapter : true,
              playCount: 0
          };

          this.container = document.querySelector( props.container );

          this.container.innerHTML = videoTag;
          this.container.insertAdjacentHTML('beforeend', videoControls);
          this.timecode = this.container.querySelector('.timecode');

          this.settings = document.createElement('div');
          this.settings.setAttribute('class', 'settings hidden');
          this.container.appendChild( this.settings );
          this.settings.innerHTML = settingsUI;

          this.media = document.querySelector('video');
          this.btnPlayPause = document.querySelector('.video-controls .play-pause');
          this.btnPrev = document.querySelector('.video-controls .prev');
          this.btnNext = document.querySelector('.video-controls .next');
          this.btnPlayPauselistNext = this.container.querySelector('.playlist-next');
          this.btnPlayPauselistPrev = this.container.querySelector('.playlist-prev');
          this.btnSettings = this.container.querySelector('button.settings');

          /**
           * Checkbox to control setting for autoplay next pause point.
           * @type {Element}
           */
          this.btnAutoPlayNextPP = this.settings.querySelector('.autoplay-next-pause-point');

          if(!this.state.autoplayNextPausePoint) this.btnAutoPlayNextPP.removeAttribute('checked');

          /**
           * Checkbox to control setting for autoplay next chapter.
           * @type {Element}
           */
          this.btnAutoPlayNextChap = this.settings.querySelector('.autoplay-next-chapter');

          if(!this.state.autoplayNextChapter) this.btnAutoPlayNextChap.removeAttribute('checked');


          /**
           * Button to confirm settings and close settings UI.
           * @type {Element}
           */
          this.btnSettingsConfirm = this.container.querySelector('.settings-confirm');

          /**
           * Timeline buttons for skipping to specific pause points.
           * @type {NodeList|null}
           */
          this.btnPausePoints = null;

          this.timelineContainer = document.querySelector('.timeline-container');
          this.timelineFill = document.querySelector('.timeline-fill');
          this.timelinePausePointsContainer = document.querySelector('.timeline-pause-points-container');

          this.media.addEventListener('timeupdate', (e)=>{
              this.timecodeUpdate();
          });

          this.media.addEventListener('ended', (e)=>{
              this.nextPlaylistItem();
          });

          this.btnPlayPause.addEventListener('click', e => {
              this.toggle();
              e.target.closest('button').blur();
          });

          this.btnNext.addEventListener('click', e => {
              this.next();
              e.target.closest('button').blur();
          });

          this.btnPrev.addEventListener('click', e => {
              this.prev();
              e.target.closest('button').blur();
          });

          this.btnPlayPauselistNext.addEventListener('click', e => {
              this.nextPlaylistItem();
              e.target.closest('button').blur();
          });

          this.btnPlayPauselistPrev.addEventListener('click', e => {
              this.prevPlaylistItem();
              e.target.closest('button').blur();
          });

          this.btnSettings.addEventListener('click', e => {
              this.showSettings();
              e.target.closest('button').blur();
          });

          this.btnSettingsConfirm.addEventListener('click', e => {
              this.hideSettings();
          });

          this.btnAutoPlayNextPP.addEventListener('change', e => {
              sessionStorage.setItem('autoPlayNextPausePoint', e.target.checked);
              this.state.autoplayNextPausePoint = e.target.checked;
          });

          this.btnAutoPlayNextChap.addEventListener('change', e => {
              sessionStorage.setItem('autoPlayNextChapter', e.target.checked);
              this.state.autoplayNextChapter = e.target.checked;
          });

          this.media.addEventListener('durationchange', (e)=>{
              // Remove event listeners for any existing pause point buttons
              if(this.btnPausePoints) {
                  this.btnPausePoints.forEach(element => {
                      element.removeEventListener('click', this.handlePausePointClick.bind(this));
                  });
              }

              let currentPlaylistItem = this.playlist[this.state.currentPlaylistItem];

              this.timelinePausePointsContainer.innerHTML = '';

              for(let i=0; i<currentPlaylistItem.pausePoints.length; i++) {
                  this.timelinePausePointsContainer.innerHTML += `
                    <div class="timeline-pause-point"
                         data-pause-point="${currentPlaylistItem.pausePoints[i]}"
                         style="left: ${ ((currentPlaylistItem.pausePoints[i]/this.media.duration)*100)+'%' }"></div>
                `;
              }

              // Add event listeners to newly crated pause point buttons
              this.btnPausePoints = document.querySelectorAll('.timeline-pause-point');
              this.btnPausePoints.forEach(element => {
                  element.addEventListener('click', this.handlePausePointClick.bind(this));
              });
          });

          //Process all playlist items
          this.playlist = props.playlist;
          for(let i=0; i<props.playlist.length; i++) {
              let playlistItem = props.playlist[i];
              if(playlistItem.pauseFormat === 'SMTP') {
                  this.playlist[i].pausePoints = this.convertTimecodeListToSecondsList(
                      playlistItem.pausePoints,
                      playlistItem.framerate
                  );
              }
              else {
                  this.playlist[i].pausePoints = playlistItem;
              }
          }
          this.loadPlaylistItem( this.state.currentPlaylistItem );

          this.keyboard = keyboard;

          // Setup keyboard controls
          this.keyboard.bind('space', ()=>{ this.toggle(); });

          this.keyboard.bind('left', ()=>{ this.prev(); });

          this.keyboard.bind('right', ()=>{ this.next(); });

          this.keyboard.bind('shift > left', ()=>{ this.prevPlaylistItem(); });

          this.keyboard.bind('shift > right', ()=>{ this.nextPlaylistItem();});

          this.keyboard.bind('s', ()=>{ this.showSettings(); });
      }

      /**
       * Code that needs to run every time the demo's timecode changes, like checking for pause points.
       */
      timecodeUpdate(){

          // Update previous timecode and current timecode
          this.state.timecodePrev = this.roundTime( this.state.timecodeCurrent );
          this.state.timecodeCurrent = this.roundTime( this.media.currentTime );

          // Storing values as shorter to reference constants
          const prevTime = this.state.timecodePrev;
          const currentTime = this.roundTime( this.media.currentTime );
          const pausePoints = this.playlist[ this.state.currentPlaylistItem ].pausePoints;

          // Update the UI timecode and timeline (these need to happen regardless of outcome)
          this.timecode.innerHTML = currentTime;
          this.timelineFill.style.width = ((currentTime/this.media.duration)*100)+'%';

          // If the timecode is higher than the previous (moving forwards)
          if(currentTime >= prevTime) {

              // For every pause point
              for(let i=0; i<pausePoints.length; i++) {

                  // If we have gained some safe distance from the previous pause point
                  if(currentTime > (this.state.pausePointCurrent + 0.3)) {
                      // If the current time falls within a narrow window of this pause point
                      if(currentTime > (pausePoints[i] - 0.15) && currentTime < (pausePoints[i] + 0.15) ) {

                          this.highlightPausePoint(pausePoints[i]);

                          // Update the previous and current pause point values
                          this.state.pausePointPrev = this.state.pausePointCurrent;
                          this.state.pausePointCurrent = pausePoints[i];

                          // If the media is supposed to autoplay from the next pause point ( e.g. when using next() )
                          if(this.media.dataset.autoplay === 'true') {
                              this.play();
                              this.media.dataset.autoplay = 'false';
                          }
                          // Else, no autoplay, so just pause it
                          else {
                              this.pause();
                          }
                      }
                  }
              }
          }
          // Else, moving backwards
          else {
              this.pause();

              if(currentTime > 0) {
                  // For every pause point
                  for(let i=0; i<pausePoints.length; i++) {
                      // If the current time falls within a narrow window of this pause point
                      if(currentTime > (pausePoints[i] - 0.15) && currentTime < (pausePoints[i] + 0.15) ) {

                          this.highlightPausePoint(pausePoints[i]);

                          this.state.pausePointPrev = this.state.pausePointCurrent;
                          this.state.pausePointCurrent = pausePoints[i];


                      }
                  }
              }
              else {
                  this.state.pausePointPrev = this.state.pausePointCurrent;
                  this.state.pausePointCurrent = 0;
              }


          }
      }

      highlightPausePoint(pausePoint){
          this.btnPausePoints.forEach(element => {
              element.classList.remove('current', 'previous');
              if(element.dataset.pausePoint == pausePoint) {
                  element.classList.add('current', 'viewed');
              }
          });
      }

      /**
       * Rounds time in seconds to two decimal places.
       * @param {number} time
       * @returns {number}
       */
      roundTime(time){
          return Math.round(time * 100) / 100;
      }

      /**
       * Converts an SMTP timecode to seconds.
       * @param {string} timecode
       * @param {number} framerate
       * @returns {number}
       */
      convertTimecodeToSeconds(timecode, framerate) {
          var timeArray = timecode.split(':');
          var hoursInSeconds      =   parseInt(timeArray[0]) * 60 * 60,
              minutesInSeconds    =   parseInt(timeArray[1]) * 60,
              seconds             =   parseInt(timeArray[2]),
              framesInSeconds     =   parseInt(timeArray[3]) * (1/framerate);

          return hoursInSeconds + minutesInSeconds + seconds + framesInSeconds;
      }

      convertTimecodeListToSecondsList(timecodeList, framerate) {
          let timeCodeListInSeconds = timecodeList;
          for (var i = 0; i < timecodeList.length; i++){
              timeCodeListInSeconds[i] = this.convertTimecodeToSeconds(timeCodeListInSeconds[i], framerate);
          }
          return timeCodeListInSeconds;
      }

      /**
       * Loads a specific item from the playlist into the demo's <video>.
       * @param {number} playlistItem
       */
      loadPlaylistItem(playlistItem) {
          this.state.currentPlaylistItem = playlistItem;
          this.state.pausePointPrev = 0;
          this.state.pausePointCurrent = 0;
          this.timelineFill.style.width = '0%';
          this.btnPlayPause.classList.add('pause');
          this.btnPlayPause.classList.remove('play');
          this.state.timecodePrev = 0;
          this.state.timecodeCurrent = 0;
          this.media.setAttribute('src', this.playlist[this.state.currentPlaylistItem].videoSource);
      }

      /**
       * Handles clicking on a pause point button.
       * @param {event} e
       */
      handlePausePointClick (e) {
          const pausePoint = e.target.dataset.pausePoint ? e.target.dataset.pausePoint : this.media.currentTime;
          this.goToTimeCode(pausePoint);
      }

      /**
       * Go to a specific timecode.
       * @param {int} pausePoint
       */
      goToTimeCode(pausePoint) {
          this.media.currentTime = pausePoint;
      }

      nextPlaylistItem() {

          let nextPlaylistItem = this.state.currentPlaylistItem + 1;

          if(nextPlaylistItem+1 > this.playlist.length) nextPlaylistItem = 0;

          this.loadPlaylistItem( nextPlaylistItem );

          if(this.state.autoplayNextChapter) {
              this.play();
          }
          else {
              this.pause();
          }
      }

      prevPlaylistItem() {

          let prevPlaylistItem = this.state.currentPlaylistItem - 1;

          if(prevPlaylistItem < 0) prevPlaylistItem = this.playlist.length - 1;

          this.loadPlaylistItem( prevPlaylistItem );

          if(this.state.autoplayNextChapter) {
              this.play();
          }
          else {
              this.pause();
          }
      }

      /**
       * Plays the demo from current timecode
       */
      play() {
          this.media.play();
          this.btnPlayPause.classList.add('play');
          this.btnPlayPause.classList.remove('pause');

          this.btnPausePoints.forEach(element => {
              if(element.classList.contains('current') || element.classList.contains('previous')) {
                  element.classList.remove('current', 'previous');
                  if(this.state.pausePointCurrent == element.dataset.pausePoint) {
                      element.classList.add('previous');
                  }
              }
          });

          this.state.playCount++;
      }

      /**
       * Pauses the demo
       */
      pause() {
          this.media.pause();
          this.btnPlayPause.classList.add('pause');
          this.btnPlayPause.classList.remove('play');
      }

      toggle() {
          if(this.media.paused) {
              this.play();
          }
          else {
              this.pause();
          }
      }

      /**
       * Skips to the next pause point in the demo
       */
      next() {

          if(this.media.paused) this.media.play();

          const currentTime = this.media.currentTime;

          const pausePoints = this.playlist[ this.state.currentPlaylistItem ].pausePoints;

          let nextPausePoint = 0;

          for(let i=0; i<pausePoints.length; i++) {

              if( currentTime < (pausePoints[i] - 0.15) && this.state.pausePointCurrent !== pausePoints[i] ) {
                  nextPausePoint = pausePoints[i];
                  if(this.state.autoplayNextPausePoint) this.media.dataset.autoplay = 'true';
                  this.media.currentTime = nextPausePoint - 0.15;
                  break;
              }
          }

          if(nextPausePoint === 0) this.nextPlaylistItem();
      }

      /**
       * Skips back to the previous pause point in the demo
       */
      prev() {
          const currentTime = this.media.currentTime;

          let pausePoints = this.playlist[ this.state.currentPlaylistItem ].pausePoints.slice().reverse();

          let prevPausePoint = 0;

          for(let i=0; i<pausePoints.length; i++) {
              if( currentTime > (pausePoints[i] + 0.15) ) {
                  prevPausePoint = pausePoints[i];
                  break;
              }
          }

          this.media.currentTime = prevPausePoint;
      }

      showSettings() {
          this.settings.classList.remove('hidden');
      }

      hideSettings() {
          this.settings.classList.add('hidden');
      }
  }

  const radDemo = (props) => {return new RadDemo(props)};

  return radDemo;

}());
