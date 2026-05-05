<?php

declare(strict_types=1);

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;
use MongoDB\Driver\BulkWrite;
use MongoDB\Driver\Command;
use MongoDB\Driver\Manager;
use MongoDB\Driver\Query;

function getMongoManager(): Manager
{
    if (!extension_loaded('mongodb')) {
        throw new RuntimeException('La extension mongodb de PHP no esta instalada.');
    }

    $uri = getenv('MONGODB_URI') ?: 'mongodb://127.0.0.1:27017';

    return new Manager($uri);
}

function getMongoDatabaseName(): string
{
    return getenv('MONGODB_DB') ?: 'rentplay';
}

function getMongoCollectionNamespace(string $collection): string
{
    return sprintf('%s.%s', getMongoDatabaseName(), $collection);
}

function mongoFindOne(Manager $manager, string $collection, array $filter): ?array
{
    $query = new Query($filter, ['limit' => 1]);
    $cursor = $manager->executeQuery(getMongoCollectionNamespace($collection), $query);
    $documents = $cursor->toArray();

    if ($documents === []) {
        return null;
    }

    return mongoNormalizeDocument(json_decode(json_encode($documents[0], JSON_UNESCAPED_UNICODE), true));
}

function mongoInsertOne(Manager $manager, string $collection, array $document): ObjectId
{
    $bulkWrite = new BulkWrite();
    $document['_id'] = new ObjectId();
    $bulkWrite->insert($document);

    $manager->executeBulkWrite(getMongoCollectionNamespace($collection), $bulkWrite);

    return $document['_id'];
}

function mongoPing(Manager $manager): bool
{
    $manager->executeCommand(getMongoDatabaseName(), new Command(['ping' => 1]));

    return true;
}

function mongoIdToString(mixed $id): string
{
    if ($id instanceof ObjectId) {
        return (string) $id;
    }

    return (string) $id;
}

function mongoDateToIsoString(mixed $value): ?string
{
    if ($value instanceof UTCDateTime) {
        return $value->toDateTime()->format(DATE_ATOM);
    }

    return is_string($value) ? $value : null;
}

function mongoNormalizeDocument(mixed $value): mixed
{
    if ($value instanceof ObjectId) {
        return (string) $value;
    }

    if ($value instanceof UTCDateTime) {
        return $value->toDateTime()->format(DATE_ATOM);
    }

    if (!is_array($value)) {
        return $value;
    }

    if (array_key_exists('$oid', $value) && count($value) === 1) {
        return (string) $value['$oid'];
    }

    if (array_key_exists('$date', $value) && count($value) === 1) {
        return is_string($value['$date']) ? $value['$date'] : json_encode($value['$date'], JSON_UNESCAPED_UNICODE);
    }

    $normalized = [];

    foreach ($value as $key => $item) {
        $normalized[$key] = mongoNormalizeDocument($item);
    }

    return $normalized;
}
