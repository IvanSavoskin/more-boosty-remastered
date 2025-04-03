import { CleanWebpackPlugin } from "clean-webpack-plugin";
import path from "path";

import rspack from "@rspack/core";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

const PATHS = {
    src: path.join(__dirname, "./src"),
    srcOptions: path.join(__dirname, "./src/options"),
    srcContent: path.join(__dirname, "./src/content"),
    srcBackground: path.join(__dirname, "./src/background"),
    staticImages: path.join(__dirname, "./src/static/images"),
    public: path.join(__dirname, "./public"),
    publicHtml: path.join(__dirname, "./public/html"),
    publicFiles: path.join(__dirname, "./public/files"),
    publicIcons: path.join(__dirname, "./public/icons"),
    publicLocales: path.join(__dirname, "./public/_locales"),
    dist: path.join(__dirname, "./dist"),
    distJs: path.join(__dirname, "./dist/js"),
    distIcons: path.join(__dirname, "./dist/icons"),
    nodeModules: path.resolve(__dirname, "./node_modules")
};

const rspack_ = (_: any, argv: any) => {
    const isProduction = argv.mode === "production";

    return {
        mode: isProduction ? "production" : "development",
        devtool: isProduction ? false : "source-map",
        context: __dirname,
        target: "web",
        entry: {
            content: path.join(PATHS.srcContent, "index.ts"),
            background: path.join(PATHS.srcBackground, "index.ts"),
            options: path.join(PATHS.srcOptions, "index.ts")
        },
        output: {
            path: PATHS.distJs,
            filename: "[name].js",
            clean: true
        },
        experiments: {
            css: true
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: [PATHS.nodeModules],
                    loader: "builtin:swc-loader",
                    options: {
                        jsc: {
                            parser: {
                                syntax: "typescript"
                            }
                        },
                        compilerOptions: {
                            module: "ESNext",
                            removeComments: false
                        }
                    },
                    type: "javascript/auto"
                },
                {
                    test: /\.scss$/,
                    exclude: [PATHS.nodeModules],
                    use: [
                        rspack.CssExtractRspackPlugin.loader,
                        {
                            loader: "css-loader",
                            options: {
                                import: true,
                                sourceMap: !isProduction,
                                modules: {
                                    namedExport: false,
                                    auto: true,
                                    localIdentName: isProduction ? "[hash:base64]" : "[path][name]__[local]",
                                    exportLocalsConvention: "camelCaseOnly"
                                }
                            }
                        },
                        {
                            loader: "builtin:lightningcss-loader",
                            options: {
                                targets: "chrome >= 110"
                            }
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: !isProduction,
                                api: "modern-compiler",
                                implementation: require.resolve("sass-embedded")
                            }
                        }
                    ]
                }
            ]
        },
        resolve: {
            extensions: [".js", ".jsx", ".ts", ".tsx", ".scss", ".css", ".svg", ".png"],
            alias: {
                "@api": path.resolve(__dirname, "src/api"),
                "@static": path.resolve(__dirname, "src/static"),
                "@coreUtils": path.resolve(__dirname, "src/utils"),
                "@models": path.resolve(__dirname, "src/models")
            }
        },
        plugins: [
            new CleanWebpackPlugin(),
            new rspack.ProgressPlugin(),
            new rspack.CopyRspackPlugin({
                patterns: [
                    {
                        from: `${PATHS.publicFiles}/`,
                        to: "../"
                    },
                    {
                        from: `${PATHS.publicIcons}/`,
                        to: "../icons/"
                    },
                    {
                        from: `${PATHS.publicLocales}/`,
                        to: "../_locales/"
                    },
                    {
                        from: `${PATHS.staticImages}/`,
                        to: "../static/assets/"
                    }
                ]
            }),
            isProduction && new TsCheckerRspackPlugin({ typescript: { mode: "write-references" } }),
            new rspack.HtmlRspackPlugin({
                template: `${PATHS.publicHtml}/options.html`,
                filename: "../options.html",
                excludeChunks: ["content", "background"]
            }),
            new rspack.CssExtractRspackPlugin({
                filename: "../css/[name].css",
                chunkFilename: "../css/[name].css"
            })
        ].filter(Boolean)
    };
};
export default rspack_;
