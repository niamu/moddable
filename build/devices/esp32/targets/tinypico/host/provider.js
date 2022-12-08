/*
 * Copyright (c) 2021  Moddable Tech, Inc.
 *
 *   This file is part of the Moddable SDK Runtime.
 *
 *   The Moddable SDK Runtime is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   The Moddable SDK Runtime is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with the Moddable SDK Runtime.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import Analog from "embedded:io/analog";
import Digital from "embedded:io/digital";
import DigitalBank from "embedded:io/digitalbank";
import I2C from "embedded:io/i2c";
import PulseCount from "embedded:io/pulsecount";
import PWM from "embedded:io/pwm";
import Serial from "embedded:io/serial";
import SMBus from "embedded:io/smbus";
import SPI from "embedded:io/spi";

const device = {
	I2C: {
		default: {
			io: I2C,
			data: 21,
			clock: 22
		}
	},
	Serial: {
		default: {
			io: Serial,
			port: 1,
			receive: 3,
			transmit: 1
		}
	},
	// Reference: https://github.com/tinypico/tinypico-micropython/blob/c19e465d6580b7ad189a21a9818f1ed9f0c5fece/tinypico-helper/micropython_dotstar.py
	Dotstar: class {
		constructor() {
			this.detectPower = new Digital({
				pin: device.pin.DETECT_PWR,
				mode: Digital.Output
			});

			this.power = new Digital({
				pin: device.pin.DOTSTAR_PWR,
				mode: Digital.Output
			});

			this._spi = new SPI({
				io: SPI,
				clock: device.pin.DOTSTAR_CLK,
				out: device.pin.DOTSTAR_DATA,
				port: 1,
				hz: 20_000_000
			});

			this._brightness = 1;
			this._rgb = [0x00, 0x00, 0x00];
			this.setPower(true);
		}

		setPower(isOn = true) {
			let state = isOn ? 0 : 1;
			this.detectPower.write(state);
			this.power.write(state);
		}

		brightness(value) {
			// Float value 0..1
			this._brightness = Math.max(Math.min(value, 1), 0);
			this.show();
		}

		color(value) {
			/*
			value can be one of three things:
					a (r,g,b) list/tuple
					a (r,g,b, brightness) list/tuple
					a single, longer int that contains RGB values, like 0xFFFFFF
				brightness, if specified should be a float 0..1

			Set a pixel value. You can set per-pixel brightness here, if it's not passed it
			will use the max value for pixel brightness value, which is a good default.

			Important notes about the per-pixel brightness - it's accomplished by
			PWMing the entire output of the LED, and that PWM is at a much
			slower clock than the rest of the LEDs. This can cause problems in
			Persistence of Vision Applications
			*/
			let rgb = value;
			if (typeof(rgb) == "number") {
				rgb = [value & 0xFF, (value >> 8) & 0xFF, value >> 16];
			} else if (rgb.length == 4) {
				this._brightness = value[3];
			} else {
				this._brightness = 1;
			}
			this._rgb = [rgb[0], rgb[1], rgb[2]];
			this.show();
		}

		show() {
			let brightness = 32 - Math.round(32 - this._brightness * 31) & 0b00011111;
			let [r, g, b] = this._rgb;
			this._spi.write(Uint8Array.from([
				0x00, 0x00, 0x00, 0x00,
				0xE0 | brightness, b, g, r,
				0xFF, 0xFF, 0xFF, 0xFF
			]));
		}
	},
	SPI: {
		default: {
			io: SPI,
			clock: 18,
			in: 19,
			out: 23,
			port: 1
		}
	},
	io: {Analog, Digital, DigitalBank, I2C, PulseCount, PWM, Serial, SMBus, SPI},
	pin: {
		DETECT_PWR: 9,
		DOTSTAR_CLK: 12,
		DOTSTAR_DATA: 2,
		DOTSTAR_PWR: 13,
	},
};

export default device;
