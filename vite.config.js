import {defineConfig} from "vite"

export default defineConfig({
	plugins: [
		
	],
	server: {
		port: 5500,
		open: true
	},
	define: {
		'process.env': {}
	}
})