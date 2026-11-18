Unicode true
RequestExecutionLevel user
SetCompressor /SOLID lzma

!include "MUI2.nsh"
!include "WinVer.nsh"
!include "x64.nsh"

!define PRODUCT_NAME "Ridgebound"
!define APP_KEY "Software\Watertube\Ridgebound"
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ridgebound"
!define START_PATH "$SMPROGRAMS\Ridgebound"

Name "${PRODUCT_NAME}"
OutFile "${OUTPUT_EXE}"
InstallDir "$LOCALAPPDATA\Programs\Ridgebound"
InstallDirRegKey HKCU "${APP_KEY}" "InstallDir"

!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\Ridgebound.exe"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "Ridgebound requires a 64-bit Windows system."
    Abort
  ${EndIf}
  ${IfNot} ${AtLeastWin7}
    MessageBox MB_OK|MB_ICONSTOP "Ridgebound requires Windows 7 or later."
    Abort
  ${EndIf}
  SetShellVarContext current
FunctionEnd

Section "Ridgebound"
  SetOutPath "$INSTDIR"
  File "${APP_FILES}/Ridgebound.exe"
  File "${APP_FILES}/Ridgebound.pck"
  File "${APP_FILES}/ridgebound-wheel-bridge.exe"
  File "${APP_FILES}/README.txt"
  SetOutPath "$INSTDIR\licenses"
  File "${APP_FILES}/licenses/*"
  SetOutPath "$INSTDIR"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "${START_PATH}"
  CreateShortCut "${START_PATH}\Ridgebound.lnk" "$INSTDIR\Ridgebound.exe"
  CreateShortCut "${START_PATH}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "${APP_KEY}" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "Publisher" "Watertube"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\Ridgebound.exe"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  SetShellVarContext current
  Delete "${START_PATH}\Ridgebound.lnk"
  Delete "${START_PATH}\Uninstall.lnk"
  RMDir "${START_PATH}"
  Delete "$INSTDIR\Ridgebound.exe"
  Delete "$INSTDIR\Ridgebound.pck"
  Delete "$INSTDIR\ridgebound-wheel-bridge.exe"
  Delete "$INSTDIR\README.txt"
  Delete "$INSTDIR\licenses\Godot-LICENSE.txt"
  Delete "$INSTDIR\licenses\Godot-COPYRIGHT.txt"
  Delete "$INSTDIR\licenses\Ridgebound.txt"
  Delete "$INSTDIR\licenses\DirectInput-bridge.txt"
  Delete "$INSTDIR\licenses\g++-mingw-w64-x86-64-posix.txt"
  Delete "$INSTDIR\licenses\gcc-mingw-w64-x86-64-posix.txt"
  Delete "$INSTDIR\licenses\gcc-mingw-w64-x86-64-posix-runtime.txt"
  Delete "$INSTDIR\licenses\mingw-w64-common.txt"
  Delete "$INSTDIR\licenses\mingw-w64-x86-64-dev.txt"
  RMDir "$INSTDIR\licenses"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "${UNINSTALL_KEY}"
  DeleteRegKey HKCU "${APP_KEY}"
SectionEnd
