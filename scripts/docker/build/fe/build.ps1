$PROJECT_ROOT = "../../../.."
$DOCKER_ROOT = ""

$CONTEXT_PATH = "$PROJECT_ROOT/$DOCKER_ROOT"

$NODE_VERSION = if ($env:NODE_VERSION) { $env:NODE_VERSION } else { "26.8.1" }

docker build `
    --tag java_bc12_capstone/fe:1.0.0 `
    --platform linux/amd64 `
    --build-arg "NODE_VERSION=$NODE_VERSION" `
    --file "$CONTEXT_PATH/Dockerfile" `
    $CONTEXT_PATH
