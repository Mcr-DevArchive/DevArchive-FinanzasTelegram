# DevArchive-FinanzasTelegram
Control financiero compartido para parejas basado en Google Sheets y Google Apps Script. Permite registrar ingresos y gastos, agruparlos por categorías y personas, y generar resúmenes mensuales automáticos enviados por Telegram, facilitando una visión clara del estado económico común.

# 📊 Resumen Mensual Finanzas Telegram

![Google Apps Script](https://img.shields.io/badge/Google-Apps%20Script-blue)
![Telegram](https://img.shields.io/badge/Telegram-Bot-blue)
![Estado](https://img.shields.io/badge/Estado-Activo-success)

Automatiza el envío de un **resumen financiero mensual** a Telegram a partir de datos gestionados en **Google Sheets**, usando **Google Apps Script**.  
Ideal para control de gastos compartidos, parejas, familias o proyectos personales.

---

## 📑 Tabla de contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Características](#-características)
- [Requisitos previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Configuración](#-configuración)
- [Ejemplo de datos y salida](#-ejemplo-de-datos-y-salida)
- [Estructura del código](#-estructura-del-código)
- [Triggers](#-triggers)
- [Personalización](#-personalización)
- [Solución de problemas](#-solución-de-problemas)
- [Contribuciones](#-contribuciones)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## 📖 Descripción del Proyecto

**Resumen Mensual Finanzas Telegram** es un script de Google Apps Script que:

- Lee datos financieros mensuales desde Google Sheets.
- Calcula ingresos, gastos y saldos por persona.
- Detecta **pagos importantes no recurrentes** (tributos, seguros).
- Envía automáticamente un **mensaje formateado por Telegram** con el resumen del mes siguiente.

### ❓ ¿Qué problema soluciona?

- Evita revisar hojas manualmente.
- Centraliza la información financiera en Telegram.
- Anticipa pagos importantes antes de que termine el mes.
- Ofrece una visión clara y compartida del estado financiero.

---

## ✨ Características

- ⏱️ Ejecución automática **5 días antes de fin de mes**
- 👥 Resumen individual y total (dos personas)
- 📂 Agrupación por categorías:
  - Ingresos
  - Gastos
  - Facturas
  - Deudas
  - Ahorros
  - Suscripciones
  - Inversiones / Tributos
  - IZQUIERDA (saldo restante)
- ⚠️ Avisos especiales:
  - Tributos no recurrentes
  - Seguros
- 💶 Normalización de formatos:
  - Fechas variables (`02-feb-26`, `1 Jan 2026`)
  - Decimales europeos y americanos (`13,99` / `1,500.00`)
- 📩 Envío vía **Telegram Bot API**

---

## 🧰 Requisitos previos

- Cuenta de **Google**
- Documento de **Google Sheets**
- Acceso a **Google Apps Script**
- Un **Bot de Telegram**
- ID de chat de Telegram
- Permisos para:
  - `SpreadsheetApp`
  - `UrlFetchApp`
  - Triggers de tiempo

---

## 🚀 Instalación

### 1️⃣ Crear el script

1. Abre tu Google Sheet
2. Ve a **Extensiones → Apps Script**
3. Crea un nuevo proyecto
4. Copia el código del script en el editor

---

### 2️⃣ Configurar variables

Edita la sección `CONFIG`:

```javascript
const TELEGRAM_TOKEN = "TU_BOT_TOKEN";
const TELEGRAM_CHAT_ID = "TU_CHAT_ID";
