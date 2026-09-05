export default function AppLogoIcon(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/img/logo.png" // ruta relativa desde /public
            alt="App Logo"
        />
    );
}
