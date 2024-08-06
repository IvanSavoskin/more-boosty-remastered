import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import webpack from "webpack";

export const PATHS = {
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

const webpack_ = (_: any, argv: any) => {
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
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: [PATHS.nodeModules],
                    use: [
                        {
                            loader: "ts-loader",
                            options: {
                                compilerOptions: {
                                    module: "ESNext",
                                    removeComments: false
                                }
                            }
                        }
                    ]
                },
                {
                    test: /\.scss$/,
                    exclude: [PATHS.nodeModules],
                    use: [
                        MiniCssExtractPlugin.loader,
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
                            loader: "postcss-loader",
                            options: {
                                sourceMap: true,
                                postcssOptions: {
                                    config: path.resolve(__dirname, "postcss.config.js")
                                }
                            }
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: !isProduction
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
            new CleanWebpackPlugin({
                cleanOnceBeforeBuildPatterns: []
            }),
            new webpack.ProgressPlugin(),
            new CopyWebpackPlugin({
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
            new ForkTsCheckerWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: `${PATHS.publicHtml}/options.html`,
                filename: "../options.html",
                excludeChunks: ["content", "background"]
            }),
            new MiniCssExtractPlugin({
                filename: "../css/[name].css",
                chunkFilename: "../css/[name].css"
            })
        ]
    };
};
module.exports = webpack_;
